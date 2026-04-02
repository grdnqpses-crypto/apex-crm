/**
 * Namecheap DNS API Client
 * Handles DNS record operations via Namecheap's XML API
 */

export interface NamecheapConfig {
  apiUser: string;
  apiKey: string;
  userName: string;
  domain: string;
  sandbox?: boolean;
}

export class NamecheapDNSClient {
  private apiUser: string;
  private apiKey: string;
  private userName: string;
  private domain: string;
  private baseUrl: string;
  private clientIp: string = '127.0.0.1';

  constructor(config: NamecheapConfig) {
    this.apiUser = config.apiUser;
    this.apiKey = config.apiKey;
    this.userName = config.userName;
    this.domain = config.domain;
    this.baseUrl = config.sandbox
      ? 'https://api.sandbox.namecheap.com/api/xml.response'
      : 'https://api.namecheap.com/api/xml.response';
  }

  /**
   * Build Namecheap API request URL
   */
  private buildUrl(command: string, params: Record<string, string>): string {
    const baseParams = {
      ApiUser: this.apiUser,
      ApiKey: this.apiKey,
      UserName: this.userName,
      ClientIp: this.clientIp,
      Command: command,
    };

    const allParams = { ...baseParams, ...params };
    const queryString = new URLSearchParams(allParams).toString();
    return `${this.baseUrl}?${queryString}`;
  }

  /**
   * Parse XML response from Namecheap
   */
  private parseXML(xml: string): any {
    // Simple XML parser for Namecheap responses
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    if (doc.getElementsByTagName('Error').length > 0) {
      const error = doc.getElementsByTagName('Error')[0];
      throw new Error(`Namecheap API Error: ${error.textContent}`);
    }

    return doc;
  }

  /**
   * Get DNS records for the domain
   */
  async getRecords(): Promise<any[]> {
    const [sld, tld] = this.domain.split('.');
    const url = this.buildUrl('namecheap.domains.dns.getHosts', {
      SLD: sld,
      TLD: tld,
    });

    const response = await fetch(url);
    const xml = await response.text();
    const doc = this.parseXML(xml);

    const records: any[] = [];
    const hosts = doc.getElementsByTagName('host');
    
    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[i];
      records.push({
        name: host.getAttribute('Name'),
        type: host.getAttribute('Type'),
        data: host.getAttribute('Address'),
        ttl: host.getAttribute('TTL'),
        priority: host.getAttribute('MXPref'),
      });
    }

    return records;
  }

  /**
   * Add DNS records
   */
  async addRecords(records: Array<{
    name: string;
    type: string;
    data: string;
    ttl?: number;
    priority?: number;
  }>): Promise<void> {
    const [sld, tld] = this.domain.split('.');
    
    // Get existing records first
    const existing = await this.getRecords();
    
    // Merge with new records
    const allRecords = [...existing];
    for (const record of records) {
      // Remove existing record of same type and name
      const index = allRecords.findIndex(
        r => r.name === record.name && r.type === record.type
      );
      if (index >= 0) {
        allRecords.splice(index, 1);
      }
      allRecords.push(record);
    }

    // Build request params
    const params: Record<string, string> = {
      SLD: sld,
      TLD: tld,
    };

    allRecords.forEach((record, index) => {
      const i = index + 1;
      params[`HostName${i}`] = record.name || '@';
      params[`RecordType${i}`] = record.type;
      params[`RecordAddress${i}`] = record.data;
      params[`TTL${i}`] = String(record.ttl || 1800);
      if (record.priority) {
        params[`MXPref${i}`] = String(record.priority);
      }
    });

    const url = this.buildUrl('namecheap.domains.dns.setHosts', params);
    const response = await fetch(url);
    const xml = await response.text();
    this.parseXML(xml); // Will throw if error
  }

  /**
   * Delete DNS record
   */
  async deleteRecord(name: string, type: string): Promise<void> {
    const records = await this.getRecords();
    const filtered = records.filter(r => !(r.name === name && r.type === type));
    
    const [sld, tld] = this.domain.split('.');
    const params: Record<string, string> = {
      SLD: sld,
      TLD: tld,
    };

    filtered.forEach((record, index) => {
      const i = index + 1;
      params[`HostName${i}`] = record.name || '@';
      params[`RecordType${i}`] = record.type;
      params[`RecordAddress${i}`] = record.data;
      params[`TTL${i}`] = String(record.ttl || 1800);
    });

    const url = this.buildUrl('namecheap.domains.dns.setHosts', params);
    const response = await fetch(url);
    const xml = await response.text();
    this.parseXML(xml);
  }

  /**
   * Get domain info
   */
  async getDomainInfo(): Promise<any> {
    const [sld, tld] = this.domain.split('.');
    const url = this.buildUrl('namecheap.domains.getInfo', {
      DomainName: this.domain,
    });

    const response = await fetch(url);
    const xml = await response.text();
    const doc = this.parseXML(xml);
    
    const domain = doc.getElementsByTagName('DomainGetInfoResult')[0];
    return {
      domain: domain.getAttribute('Domain'),
      status: domain.getAttribute('Status'),
      expiration: domain.getAttribute('ExpiredDate'),
    };
  }
}

/**
 * Namecheap OAuth Client for API access
 */
export class NamecheapOAuthClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate authorization token
   * Namecheap uses API key directly, no OAuth flow needed
   */
  getAuthToken(): string {
    return this.apiKey;
  }

  /**
   * Validate API credentials
   */
  async validateCredentials(apiUser: string, apiKey: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        ApiUser: apiUser,
        ApiKey: apiKey,
        UserName: apiUser,
        ClientIp: '127.0.0.1',
        Command: 'namecheap.users.getBalance',
      });

      const response = await fetch(
        `https://api.namecheap.com/api/xml.response?${params.toString()}`
      );
      const xml = await response.text();
      
      return !xml.includes('<Error');
    } catch {
      return false;
    }
  }
}
