import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { GoDaddyDNSClient, DNSRecordGenerator, GoDaddyOAuthClient } from '../dns/godaddy-client';
import { DNSProviderDetector } from '../dns/provider-detector';
import { DNSPropagationChecker } from '../dns/propagation-checker';
import { migrationEngineEvents } from '../migration-engine-events';
import { DNSProviderFactory, UnifiedDNSManager } from '../dns/dns-provider-factory';

export const dnsRouter = router({
  /**
   * Detect DNS provider for a domain
   */
  detectProvider: protectedProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      if (!DNSProviderDetector.isValidDomain(input.domain)) {
        throw new Error('Invalid domain format');
      }

      const result = await DNSProviderDetector.detectProvider(input.domain);
      return result;
    }),

  /**
   * Generate DNS records needed for email authentication
   */
  generateRecords: protectedProcedure
    .input(z.object({
      domain: z.string(),
      dkimSelector: z.string().default('default'),
      includeProviders: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      // Generate DKIM key pair
      const { privateKey, publicKey } = DNSRecordGenerator.generateDKIMKeyPair();

      // Generate records
      const spf = DNSRecordGenerator.generateSPFRecord(
        input.domain,
        input.includeProviders
      );
      const dkim = DNSRecordGenerator.generateDKIMRecord(
        input.dkimSelector,
        publicKey
      );
      const dmarc = DNSRecordGenerator.generateDMARCRecord(
        input.domain,
        `dmarc-reports@${input.domain}`
      );

      return {
        records: [spf, dkim, dmarc],
        dkimPrivateKey: privateKey,
        dkimPublicKey: publicKey,
        dkimSelector: input.dkimSelector,
      };
    }),

  /**
   * Setup GoDaddy OAuth authorization
   */
  getGoDaddyAuthUrl: protectedProcedure
    .input(z.object({ state: z.string() }))
    .query(({ input }) => {
      const oauthClient = new GoDaddyOAuthClient({
        clientId: process.env.GODADDY_CLIENT_ID || '',
        clientSecret: process.env.GODADDY_CLIENT_SECRET || '',
        redirectUri: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/dns-oauth-callback`,
      });

      const authUrl = oauthClient.getAuthorizationUrl(input.state);
      return { authUrl };
    }),

  /**
   * Exchange GoDaddy OAuth code for access token
   */
  exchangeGoDaddyCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const oauthClient = new GoDaddyOAuthClient({
        clientId: process.env.GODADDY_CLIENT_ID || '',
        clientSecret: process.env.GODADDY_CLIENT_SECRET || '',
        redirectUri: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/dns-oauth-callback`,
      });

      const { accessToken, expiresIn } = await oauthClient.getAccessToken(input.code);
      
      // In production, store this securely in the database
      return {
        accessToken,
        expiresIn,
        tokenType: 'Bearer',
      };
    }),

  /**
   * Configure DNS records on any provider
   */
  configureDNSRecords: protectedProcedure
    .input(z.object({
      domain: z.string(),
      provider: z.enum(['godaddy', 'namecheap', 'route53', 'cloudflare', 'google-domains']),
      credentials: z.record(z.string()),
      records: z.array(z.object({
        type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV']),
        name: z.string(),
        data: z.string(),
        ttl: z.number().optional(),
        priority: z.number().optional(),
      })),
      jobId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        if (input.jobId) {
          migrationEngineEvents.onDNSSetupStart(input.jobId, input.domain);
        }

        // Create provider instance using factory
        const client = DNSProviderFactory.createProvider(
          input.provider,
          input.domain,
          input.credentials
        );

        // Add records to provider
        await client.addRecords(input.records);

        if (input.jobId) {
          migrationEngineEvents.onDNSSetupComplete(input.jobId, input.domain, true);
        }

        return {
          success: true,
          message: `DNS records configured on ${DNSProviderFactory.getProviderName(input.provider)} for ${input.domain}`,
          provider: input.provider,
        };
      } catch (error) {
        if (input.jobId) {
          migrationEngineEvents.onDNSSetupComplete(
            input.jobId,
            input.domain,
            false,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    }),

  /**
   * Check DNS propagation status
   */
  checkPropagation: protectedProcedure
    .input(z.object({
      domain: z.string(),
      recordType: z.string(),
      recordName: z.string().default('@'),
      expectedValue: z.string().optional(),
      jobId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        if (input.jobId) {
          migrationEngineEvents.onDNSVerificationStart(input.jobId, input.domain);
        }

        const status = await DNSPropagationChecker.checkPropagation(
          input.domain,
          input.recordType,
          input.recordName,
          input.expectedValue
        );

        if (input.jobId) {
          migrationEngineEvents.onDNSVerificationProgress(
            input.jobId,
            input.domain,
            status.globalProgress
          );
        }

        return {
          ...status,
          message: DNSPropagationChecker.getStatusMessage(status),
        };
      } catch (error) {
        if (input.jobId) {
          migrationEngineEvents.onDNSVerificationComplete(
            input.jobId,
            input.domain,
            false,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    }),

  /**
   * Monitor DNS propagation with polling
   */
  monitorPropagation: protectedProcedure
    .input(z.object({
      domain: z.string(),
      recordType: z.string(),
      recordName: z.string().default('@'),
      expectedValue: z.string().optional(),
      maxWaitTime: z.number().default(3600 * 48),
      pollInterval: z.number().default(30000),
      jobId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const status = await DNSPropagationChecker.monitorPropagation(
          input.domain,
          input.recordType,
          input.recordName,
          input.expectedValue,
          input.maxWaitTime,
          input.pollInterval
        );

        if (input.jobId) {
          if (status.allPropagated) {
            migrationEngineEvents.onDNSVerificationComplete(
              input.jobId,
              input.domain,
              true
            );
          } else {
            migrationEngineEvents.onDNSVerificationComplete(
              input.jobId,
              input.domain,
              false,
              'DNS propagation incomplete after max wait time'
            );
          }
        }

        return {
          ...status,
          message: DNSPropagationChecker.getStatusMessage(status),
        };
      } catch (error) {
        if (input.jobId) {
          migrationEngineEvents.onDNSVerificationComplete(
            input.jobId,
            input.domain,
            false,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        throw error;
      }
    }),

  /**
   * Verify all email authentication records
   */
  verifyEmailAuthentication: protectedProcedure
    .input(z.object({
      domain: z.string(),
      dkimSelector: z.string().default('default'),
      jobId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const result = await DNSPropagationChecker.verifyEmailAuthentication(
          input.domain,
          input.dkimSelector
        );

        return {
          ...result,
          allValid: result.allValid,
          spfMessage: DNSPropagationChecker.getStatusMessage(result.spf),
          dkimMessage: DNSPropagationChecker.getStatusMessage(result.dkim),
          dmarcMessage: DNSPropagationChecker.getStatusMessage(result.dmarc),
        };
      } catch (error) {
        throw error;
      }
    }),
});
