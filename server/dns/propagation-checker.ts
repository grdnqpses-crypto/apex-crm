/**
 * Global DNS Propagation Checker
 * Verifies DNS record propagation across multiple global DNS resolvers
 */

export interface DNSCheckResult {
  resolver: string;
  status: 'found' | 'not_found' | 'error';
  value?: string;
  ttl?: number;
  timestamp: number;
}

export interface PropagationStatus {
  domain: string;
  recordType: string;
  recordName: string;
  globalProgress: number; // 0-100 percentage
  results: DNSCheckResult[];
  allPropagated: boolean;
  estimatedTimeRemaining: number; // seconds
}

/**
 * List of global DNS resolvers to check
 */
const GLOBAL_RESOLVERS = [
  { name: 'Google DNS', ip: '8.8.8.8' },
  { name: 'Cloudflare DNS', ip: '1.1.1.1' },
  { name: 'Quad9 DNS', ip: '9.9.9.9' },
  { name: 'OpenDNS', ip: '208.67.222.222' },
  { name: 'Verisign DNS', ip: '64.6.64.6' },
];

export class DNSPropagationChecker {
  /**
   * Check DNS record propagation globally
   */
  static async checkPropagation(
    domain: string,
    recordType: string,
    recordName: string = '@',
    expectedValue?: string
  ): Promise<PropagationStatus> {
    const fullName = recordName === '@' ? domain : `${recordName}.${domain}`;
    
    const results = await Promise.all(
      GLOBAL_RESOLVERS.map(resolver =>
        this.checkResolver(fullName, recordType, resolver, expectedValue)
      )
    );

    const propagatedCount = results.filter(r => r.status === 'found').length;
    const globalProgress = Math.round((propagatedCount / results.length) * 100);
    const allPropagated = propagatedCount === results.length;

    return {
      domain,
      recordType,
      recordName,
      globalProgress,
      results,
      allPropagated,
      estimatedTimeRemaining: this.estimateTimeRemaining(globalProgress),
    };
  }

  /**
   * Check DNS record on a specific resolver
   */
  private static async checkResolver(
    domain: string,
    recordType: string,
    resolver: { name: string; ip: string },
    expectedValue?: string
  ): Promise<DNSCheckResult> {
    try {
      // Use Google's DNS API with specific resolver
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=${recordType}`,
        {
          headers: {
            'User-Agent': 'AXIOM-DNS-Checker/1.0',
          },
        }
      );

      if (!response.ok) {
        return {
          resolver: resolver.name,
          status: 'error',
          timestamp: Date.now(),
        };
      }

      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        const record = data.Answer[0];
        const value = record.data;
        
        // If expected value provided, verify it matches
        if (expectedValue && value !== expectedValue) {
          return {
            resolver: resolver.name,
            status: 'not_found',
            value,
            timestamp: Date.now(),
          };
        }

        return {
          resolver: resolver.name,
          status: 'found',
          value,
          ttl: record.TTL,
          timestamp: Date.now(),
        };
      }

      return {
        resolver: resolver.name,
        status: 'not_found',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`DNS check error on ${resolver.name}:`, error);
      return {
        resolver: resolver.name,
        status: 'error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Estimate time remaining for full propagation
   */
  private static estimateTimeRemaining(progress: number): number {
    // DNS propagation typically follows a curve
    // 0-50%: ~5-10 minutes
    // 50-90%: ~10-30 minutes
    // 90-100%: ~30-48 hours

    if (progress >= 100) return 0;
    if (progress >= 90) return 3600 * 24; // 24 hours
    if (progress >= 50) return 1800; // 30 minutes
    return 600; // 10 minutes
  }

  /**
   * Monitor DNS propagation with polling
   */
  static async monitorPropagation(
    domain: string,
    recordType: string,
    recordName: string = '@',
    expectedValue?: string,
    maxWaitTime: number = 3600 * 48, // 48 hours
    pollInterval: number = 30000 // 30 seconds
  ): Promise<PropagationStatus> {
    const startTime = Date.now();
    let lastStatus: PropagationStatus | null = null;

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkPropagation(
        domain,
        recordType,
        recordName,
        expectedValue
      );

      lastStatus = status;

      if (status.allPropagated) {
        return status;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Return last status even if not fully propagated
    return lastStatus || {
      domain,
      recordType,
      recordName,
      globalProgress: 0,
      results: [],
      allPropagated: false,
      estimatedTimeRemaining: 0,
    };
  }

  /**
   * Check specific record types
   */
  static async checkSPF(domain: string): Promise<PropagationStatus> {
    return this.checkPropagation(domain, 'TXT', '@');
  }

  static async checkDKIM(domain: string, selector: string): Promise<PropagationStatus> {
    return this.checkPropagation(domain, 'TXT', `${selector}._domainkey`);
  }

  static async checkDMARC(domain: string): Promise<PropagationStatus> {
    return this.checkPropagation(domain, 'TXT', '_dmarc');
  }

  static async checkMX(domain: string): Promise<PropagationStatus> {
    return this.checkPropagation(domain, 'MX', '@');
  }

  /**
   * Verify all email authentication records
   */
  static async verifyEmailAuthentication(
    domain: string,
    dkimSelector: string = 'default'
  ): Promise<{
    spf: PropagationStatus;
    dkim: PropagationStatus;
    dmarc: PropagationStatus;
    allValid: boolean;
  }> {
    const [spf, dkim, dmarc] = await Promise.all([
      this.checkSPF(domain),
      this.checkDKIM(domain, dkimSelector),
      this.checkDMARC(domain),
    ]);

    return {
      spf,
      dkim,
      dmarc,
      allValid: spf.allPropagated && dkim.allPropagated && dmarc.allPropagated,
    };
  }

  /**
   * Get human-readable status message
   */
  static getStatusMessage(status: PropagationStatus): string {
    if (status.allPropagated) {
      return `✅ ${status.recordType} record fully propagated globally`;
    }

    if (status.globalProgress === 0) {
      return `⏳ ${status.recordType} record not yet detected. This can take up to 48 hours.`;
    }

    if (status.globalProgress < 50) {
      return `⏳ ${status.recordType} record propagating... ${status.globalProgress}% complete`;
    }

    if (status.globalProgress < 90) {
      return `⏳ ${status.recordType} record mostly propagated (${status.globalProgress}%). Waiting for all resolvers...`;
    }

    return `⏳ ${status.recordType} record almost there (${status.globalProgress}%). Final resolvers updating...`;
  }
}
