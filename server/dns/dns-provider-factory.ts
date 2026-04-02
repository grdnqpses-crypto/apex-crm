/**
 * DNS Provider Factory
 * Unified interface for managing DNS records across all providers
 */

import { GoDaddyDNSClient } from './godaddy-client';
import { NamecheapDNSClient } from './namecheap-client';
import { Route53DNSClient } from './route53-client';
import { CloudflareDNSClient } from './cloudflare-client';
import { GoogleDomainsDNSClient } from './google-domains-client';
import { DNSProviderDetector, DNSProvider } from './provider-detector';

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'SRV';
  name: string;
  data: string;
  ttl?: number;
  priority?: number;
}

export interface DNSProviderCredentials {
  provider: DNSProvider;
  credentials: Record<string, string>;
}

/**
 * Abstract DNS provider interface
 */
export interface IDNSProvider {
  getRecords(): Promise<any[]>;
  addRecords(records: DNSRecord[]): Promise<void>;
  deleteRecord(name: string, type: string): Promise<void>;
  getDomainInfo(): Promise<any>;
}

/**
 * Factory for creating DNS provider instances
 */
export class DNSProviderFactory {
  /**
   * Create DNS provider instance based on provider type
   */
  static createProvider(
    provider: DNSProvider,
    domain: string,
    credentials: Record<string, string>
  ): IDNSProvider {
    switch (provider) {
      case 'godaddy':
        return new GoDaddyDNSClient({
          apiKey: credentials.apiKey || '',
          apiSecret: credentials.apiSecret || '',
          domain,
        });

      case 'namecheap':
        return new NamecheapDNSClient({
          apiUser: credentials.apiUser || '',
          apiKey: credentials.apiKey || '',
          userName: credentials.userName || '',
          domain,
        });

      case 'route53':
        return new Route53DNSClient({
          accessKeyId: credentials.accessKeyId || '',
          secretAccessKey: credentials.secretAccessKey || '',
          domain,
        });

      case 'cloudflare':
        return new CloudflareDNSClient({
          apiToken: credentials.apiToken || '',
          domain,
          zoneId: credentials.zoneId,
        });

      case 'google-domains':
        return new GoogleDomainsDNSClient({
          accessToken: credentials.accessToken || '',
          domain,
          projectId: credentials.projectId,
        });

      default:
        throw new Error(`Unsupported DNS provider: ${provider}`);
    }
  }

  /**
   * Auto-detect provider and create instance
   */
  static async createProviderAuto(
    domain: string,
    credentials: Record<string, string>
  ): Promise<{ provider: DNSProvider; client: IDNSProvider }> {
    const detection = await DNSProviderDetector.detectProvider(domain);
    const client = this.createProvider(detection.provider, domain, credentials);
    return { provider: detection.provider, client };
  }

  /**
   * Get required credentials for provider
   */
  static getRequiredCredentials(provider: DNSProvider): string[] {
    switch (provider) {
      case 'godaddy':
        return ['apiKey', 'apiSecret'];
      case 'namecheap':
        return ['apiUser', 'apiKey', 'userName'];
      case 'route53':
        return ['accessKeyId', 'secretAccessKey'];
      case 'cloudflare':
        return ['apiToken'];
      case 'google-domains':
        return ['accessToken'];
      default:
        return [];
    }
  }

  /**
   * Get provider display name
   */
  static getProviderName(provider: DNSProvider): string {
    const names: Record<DNSProvider, string> = {
      'godaddy': 'GoDaddy',
      'namecheap': 'Namecheap',
      'route53': 'AWS Route53',
      'cloudflare': 'Cloudflare',
      'google-domains': 'Google Domains',
      'other': 'Other',
    };
    return names[provider] || 'Unknown';
  }

  /**
   * Get provider logo/icon
   */
  static getProviderIcon(provider: DNSProvider): string {
    const icons: Record<DNSProvider, string> = {
      'godaddy': '🐶',
      'namecheap': '💰',
      'route53': '☁️',
      'cloudflare': '⚡',
      'google-domains': '🔵',
      'other': '🌐',
    };
    return icons[provider] || '🌐';
  }
}

/**
 * Unified DNS Manager
 * Provides consistent interface for DNS operations across all providers
 */
export class UnifiedDNSManager {
  private provider: IDNSProvider;
  private providerType: DNSProvider;
  private domain: string;

  constructor(provider: IDNSProvider, providerType: DNSProvider, domain: string) {
    this.provider = provider;
    this.providerType = providerType;
    this.domain = domain;
  }

  /**
   * Create from auto-detection
   */
  static async create(
    domain: string,
    credentials: Record<string, string>
  ): Promise<UnifiedDNSManager> {
    const { provider, client } = await DNSProviderFactory.createProviderAuto(
      domain,
      credentials
    );
    return new UnifiedDNSManager(client, provider, domain);
  }

  /**
   * Get all DNS records
   */
  async getRecords(): Promise<DNSRecord[]> {
    return this.provider.getRecords();
  }

  /**
   * Add DNS records
   */
  async addRecords(records: DNSRecord[]): Promise<void> {
    return this.provider.addRecords(records);
  }

  /**
   * Delete DNS record
   */
  async deleteRecord(name: string, type: string): Promise<void> {
    return this.provider.deleteRecord(name, type);
  }

  /**
   * Get domain information
   */
  async getDomainInfo(): Promise<any> {
    return this.provider.getDomainInfo();
  }

  /**
   * Get provider information
   */
  getProviderInfo(): {
    name: string;
    icon: string;
    type: DNSProvider;
  } {
    return {
      name: DNSProviderFactory.getProviderName(this.providerType),
      icon: DNSProviderFactory.getProviderIcon(this.providerType),
      type: this.providerType,
    };
  }

  /**
   * Verify DNS configuration
   */
  async verifyConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const records = await this.getRecords();
      
      if (records.length === 0) {
        issues.push('No DNS records found');
      }

      // Check for essential records
      const hasA = records.some(r => r.type === 'A');
      const hasMX = records.some(r => r.type === 'MX');

      if (!hasA && !hasMX) {
        issues.push('Missing A or MX records');
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}
