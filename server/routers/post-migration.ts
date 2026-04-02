import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  sendDeliverabilityTest,
  calculateDomainHealthScore,
  getDeliverabilityTestHistory,
  scheduleDeliverabilityTest,
} from "../email-deliverability";
import {
  provisionTeamEmailAccounts,
  getTeamEmailAccounts,
  assignEmailToTeamMember,
  getEmailAccountHealth,
  getTeamEmailProvisioningStatus,
} from "../team-email-provisioning";

export const postMigrationRouter = router({
  // Email Deliverability Testing
  deliverability: router({
    runTest: protectedProcedure
      .input(
        z.object({
          domain: z.string(),
          fromEmail: z.string().email(),
          smtpConfig: z.object({
            host: z.string(),
            port: z.number(),
            secure: z.boolean(),
            auth: z.object({
              user: z.string(),
              pass: z.string(),
            }),
          }),
        })
      )
      .mutation(async ({ input }) => {
        return await sendDeliverabilityTest(
          input.domain,
          input.fromEmail,
          input.smtpConfig
        );
      }),

    getDomainHealth: protectedProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }) => {
        return await calculateDomainHealthScore(input.domain);
      }),

    getTestHistory: protectedProcedure
      .input(z.object({ domain: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getDeliverabilityTestHistory(input.domain, input.limit);
      }),

    scheduleTest: protectedProcedure
      .input(
        z.object({
          domain: z.string(),
          frequency: z.enum(["daily", "weekly", "monthly"]),
          fromEmail: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        await scheduleDeliverabilityTest(
          input.domain,
          input.frequency,
          input.fromEmail
        );
        return { success: true };
      }),
  }),

  // Team Email Provisioning
  teamEmail: router({
    provisionAccounts: protectedProcedure
      .input(
        z.object({
          teamId: z.string(),
          provider: z.enum(["gmail", "office365", "custom_smtp"]),
          credentials: z.object({
            clientId: z.string().optional(),
            clientSecret: z.string().optional(),
            refreshToken: z.string().optional(),
            smtpHost: z.string().optional(),
            smtpPort: z.number().optional(),
            smtpUser: z.string().optional(),
            smtpPassword: z.string().optional(),
          }),
          dailyLimitPerAccount: z.number().default(300),
          emailAddresses: z.array(z.string().email()),
        })
      )
      .mutation(async ({ input }) => {
        return await provisionTeamEmailAccounts(input);
      }),

    getAccounts: protectedProcedure
      .input(z.object({ teamId: z.string() }))
      .query(async ({ input }) => {
        return await getTeamEmailAccounts(input.teamId);
      }),

    assignToUser: protectedProcedure
      .input(
        z.object({
          teamId: z.string(),
          userId: z.string(),
          emailAccountId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await assignEmailToTeamMember(input.teamId, input.userId, input.emailAccountId);
        return { success: true };
      }),

    getAccountHealth: protectedProcedure
      .input(z.object({ emailAccountId: z.string() }))
      .query(async ({ input }) => {
        return await getEmailAccountHealth(input.emailAccountId);
      }),

    getProvisioningStatus: protectedProcedure
      .input(z.object({ teamId: z.string() }))
      .query(async ({ input }) => {
        return await getTeamEmailProvisioningStatus(input.teamId);
      }),
  }),

  // Setup Progress Dashboard
  setupProgress: router({
    getStatus: protectedProcedure
      .input(z.object({ migrationJobId: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        // In production, query actual setup status from database
        return {
          dataImport: { completed: true, percentage: 100 },
          emailProvider: { completed: true, percentage: 100 },
          dnsSetup: { completed: true, percentage: 100 },
          deliverabilityTest: { completed: false, percentage: 0 },
          teamProvisioning: { completed: false, percentage: 0 },
        };
      }),

    getDomainMetrics: protectedProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }) => {
        const health = await calculateDomainHealthScore(input.domain);
        return {
          overallScore: health.overallScore,
          spfScore: health.spfScore,
          dkimScore: health.dkimScore,
          dmarcScore: health.dmarcScore,
          reputationScore: health.reputationScore,
          status: health.status,
          bounceRate: health.bounceRate,
          complaintRate: health.complaintRate,
          unsubscribeRate: health.unsubscribeRate,
        };
      }),

    getRecommendations: protectedProcedure
      .input(z.object({ domain: z.string() }))
      .query(async ({ input }) => {
        // In production, generate recommendations based on metrics
        return [
          "Monitor your sender reputation daily",
          "Test email deliverability weekly",
          "Set up team email accounts for better load distribution",
          "Enable DMARC reporting for brand protection",
        ];
      }),

    generateReport: protectedProcedure
      .input(z.object({ domain: z.string(), format: z.enum(["pdf", "csv"]) }))
      .mutation(async ({ input }) => {
        // In production, generate and return report
        return {
          url: `/reports/setup-${input.domain}-${Date.now()}.${input.format}`,
          filename: `setup-report-${input.domain}.${input.format}`,
        };
      }),
  }),
});
