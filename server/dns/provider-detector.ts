/**
 * DNS Provider Detection System
 * Automatically detects which DNS provider (registrar) manages a domain
 */

export type DNSProvider = 'godaddy' | 'namecheap' | 'route53' | 'cloudflare' | 'google-domains' | 'other';

export interface ProviderDetectionResult {
  provider: DNSProvider;
  registrar: string;
  nameservers: string[];
  confidence: number; // 0-1 confidence score
}

/**
 * Detect DNS provider by analyzing WHOIS data and nameservers
 */
export class DNSProviderDetector {
  /**
   * Detect provider from domain
   */
  static async detectProvider(domain: string): Promise<ProviderDetectionResult> {
    try {
      // Get nameservers for the domain
      const nameservers = await this.getNameservers(domain);
      
      // Get WHOIS data
      const whoisData = await this.getWhoisData(domain);

      // Analyze and detect provider
      return this.analyzeProvider(domain, nameservers, whoisData);
    } catch (error) {
      console.error(`Failed to detect provider for ${domain}:`, error);
      return {
        provider: 'other',
        registrar: 'Unknown',
        nameservers: [],
        confidence: 0,
      };
    }
  }

  /**
   * Get nameservers for a domain using DNS lookup
   */
  private static async getNameservers(domain: string): Promise<string[]> {
    try {
      // Use Google's DNS API for nameserver lookup
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=NS`
      );
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (data.Answer) {
        return data.Answer
          .filter((record: any) => record.type === 2) // NS records
          .map((record: any) => record.data)
          .sort();
      }

      return [];
    } catch (error) {
      console.error(`Failed to get nameservers for ${domain}:`, error);
      return [];
    }
  }

  /**
   * Get WHOIS data for a domain
   */
  private static async getWhoisData(domain: string): Promise<string> {
    try {
      // Use a free WHOIS API
      const response = await fetch(
        `https://www.whoisxmlapi.com/api/v1?apiKey=at_free&domain=${domain}`
      );

      if (!response.ok) {
        return '';
      }

      const data = await response.json();
      return JSON.stringify(data);
    } catch (error) {
      console.error(`Failed to get WHOIS data for ${domain}:`, error);
      return '';
    }
  }

  /**
   * Analyze nameservers and WHOIS data to detect provider
   */
  private static analyzeProvider(
    domain: string,
    nameservers: string[],
    whoisData: string
  ): ProviderDetectionResult {
    const nsString = nameservers.join(' ').toLowerCase();
    const whoisLower = whoisData.toLowerCase();

    // GoDaddy detection
    if (
      nsString.includes('godaddy') ||
      whoisLower.includes('godaddy') ||
      nameservers.some(ns => ns.includes('secureserver.net'))
    ) {
      return {
        provider: 'godaddy',
        registrar: 'GoDaddy',
        nameservers,
        confidence: 0.95,
      };
    }

    // Namecheap detection
    if (
      nsString.includes('namecheap') ||
      whoisLower.includes('namecheap') ||
      nameservers.some(ns => ns.includes('namecheap.com'))
    ) {
      return {
        provider: 'namecheap',
        registrar: 'Namecheap',
        nameservers,
        confidence: 0.95,
      };
    }

    // Cloudflare detection
    if (
      nsString.includes('cloudflare') ||
      whoisLower.includes('cloudflare') ||
      nameservers.some(ns => ns.includes('ns.cloudflare.com'))
    ) {
      return {
        provider: 'cloudflare',
        registrar: 'Cloudflare',
        nameservers,
        confidence: 0.95,
      };
    }

    // AWS Route53 detection
    if (
      nsString.includes('awsdns') ||
      nameservers.some(ns => ns.includes('awsdns'))
    ) {
      return {
        provider: 'route53',
        registrar: 'AWS Route53',
        nameservers,
        confidence: 0.95,
      };
    }

    // Google Domains detection
    if (
      nsString.includes('google') ||
      whoisLower.includes('google domains') ||
      nameservers.some(ns => ns.includes('ns-goog'))
    ) {
      return {
        provider: 'google-domains',
        registrar: 'Google Domains',
        nameservers,
        confidence: 0.95,
      };
    }

    // Extract registrar from WHOIS if possible
    let registrar = 'Unknown';
    const registrarMatch = whoisData.match(/registrar:\s*([^\n]+)/i);
    if (registrarMatch) {
      registrar = registrarMatch[1].trim();
    }

    return {
      provider: 'other',
      registrar,
      nameservers,
      confidence: 0.5,
    };
  }

  /**
   * Check if domain is available (not registered)
   */
  static async isDomainAvailable(domain: string): Promise<boolean> {
    try {
      const result = await this.detectProvider(domain);
      return result.confidence === 0 && result.registrar === 'Unknown';
    } catch {
      return false;
    }
  }

  /**
   * Validate domain format
   */
  static isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain);
  }

  /**
   * Extract root domain from subdomain
   */
  static getRootDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }
}
