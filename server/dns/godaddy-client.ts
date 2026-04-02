import crypto from 'crypto';

/**
 * GoDaddy DNS API Client
 * Handles all DNS record operations via GoDaddy's REST API
 */

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'SRV';
  name: string;
  data: string;
  ttl?: number;
  priority?: number;
}

export interface GoDaddyConfig {
  apiKey: string;
  apiSecret: string;
  domain: string;
  environment?: 'production' | 'sandbox';
}

export class GoDaddyDNSClient {
  private apiKey: string;
  private apiSecret: string;
  private domain: string;
  private baseUrl: string;

  constructor(config: GoDaddyConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.domain = config.domain;
    this.baseUrl = config.environment === 'sandbox'
      ? 'https://api.sandbox.godaddy.com/v1'
      : 'https://api.godaddy.com/v1';
  }

  /**
   * Make authenticated request to GoDaddy API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `sso-key ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GoDaddy API error (${response.status}): ${error}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Get all DNS records for the domain
   */
  async getRecords(): Promise<DNSRecord[]> {
    return this.makeRequest('GET', `/domains/${this.domain}/records`);
  }

  /**
   * Get DNS records of a specific type
   */
  async getRecordsByType(type: string): Promise<DNSRecord[]> {
    return this.makeRequest('GET', `/domains/${this.domain}/records/${type}`);
  }

  /**
   * Add a single DNS record
   */
  async addRecord(record: DNSRecord): Promise<void> {
    const body = [record];
    return this.makeRequest('PATCH', `/domains/${this.domain}/records`, body);
  }

  /**
   * Add multiple DNS records in batch
   */
  async addRecords(records: DNSRecord[]): Promise<void> {
    return this.makeRequest('PATCH', `/domains/${this.domain}/records`, records);
  }

  /**
   * Update DNS records of a specific type
   */
  async updateRecordsByType(type: string, records: DNSRecord[]): Promise<void> {
    return this.makeRequest('PUT', `/domains/${this.domain}/records/${type}`, records);
  }

  /**
   * Delete DNS records of a specific type and name
   */
  async deleteRecord(type: string, name: string): Promise<void> {
    return this.makeRequest('DELETE', `/domains/${this.domain}/records/${type}/${name}`);
  }

  /**
   * Get domain details
   */
  async getDomainDetails(): Promise<any> {
    return this.makeRequest('GET', `/domains/${this.domain}`);
  }

  /**
   * Check if domain is available
   */
  async checkDomainAvailability(): Promise<boolean> {
    try {
      await this.getDomainDetails();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * DNS Record Generator
 * Generates SPF, DKIM, DMARC, and CNAME records
 */

export class DNSRecordGenerator {
  /**
   * Generate SPF record for email sending
   */
  static generateSPFRecord(domain: string, includeProviders: string[] = []): DNSRecord {
    const includes = [
      'include:sendgrid.net',
      'include:mailgun.org',
      ...includeProviders,
    ].join(' ');

    return {
      type: 'TXT',
      name: '@',
      data: `v=spf1 ${includes} -all`,
      ttl: 3600,
    };
  }

  /**
   * Generate DKIM record
   * Note: DKIM public key should be generated separately and provided
   */
  static generateDKIMRecord(selector: string, publicKey: string): DNSRecord {
    return {
      type: 'TXT',
      name: `${selector}._domainkey`,
      data: `v=DKIM1; k=rsa; p=${publicKey}`,
      ttl: 3600,
    };
  }

  /**
   * Generate DMARC record for domain protection
   */
  static generateDMARCRecord(domain: string, email: string): DNSRecord {
    return {
      type: 'TXT',
      name: '_dmarc',
      data: `v=DMARC1; p=quarantine; rua=mailto:${email}; ruf=mailto:${email}; fo=1`,
      ttl: 3600,
    };
  }

  /**
   * Generate CNAME record for email tracking
   */
  static generateTrackingCNAME(subdomain: string, target: string): DNSRecord {
    return {
      type: 'CNAME',
      name: subdomain,
      data: target,
      ttl: 3600,
    };
  }

  /**
   * Generate MX records for email delivery
   */
  static generateMXRecords(domain: string): DNSRecord[] {
    return [
      {
        type: 'MX',
        name: '@',
        data: `mail.${domain}`,
        priority: 10,
        ttl: 3600,
      },
    ];
  }

  /**
   * Generate DKIM key pair (RSA 2048)
   */
  static generateDKIMKeyPair(): { privateKey: string; publicKey: string } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Extract just the key material without PEM headers
    const publicKeyData = publicKey
      .split('\n')
      .filter(line => !line.includes('-----'))
      .join('');

    return {
      privateKey,
      publicKey: publicKeyData,
    };
  }
}

/**
 * OAuth flow for GoDaddy authentication
 * Users can grant AXIOM permission to manage their DNS records
 */

export interface GoDaddyOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment?: 'production' | 'sandbox';
}

export class GoDaddyOAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private authUrl: string;
  private tokenUrl: string;

  constructor(config: GoDaddyOAuthConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;

    const baseUrl = config.environment === 'sandbox'
      ? 'https://api.sandbox.godaddy.com'
      : 'https://api.godaddy.com';

    this.authUrl = `${baseUrl}/v1/oauth/authorize`;
    this.tokenUrl = `${baseUrl}/v1/oauth/token`;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
      scope: 'dns:manage',
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }
}
