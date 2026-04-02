/**
 * Cloudflare DNS API Client
 * Handles DNS record operations via Cloudflare's REST API
 */

export interface CloudflareConfig {
  apiToken: string;
  domain: string;
  zoneId?: string;
}

export class CloudflareDNSClient {
  private apiToken: string;
  private domain: string;
  private zoneId: string | null;
  private baseUrl: string = 'https://api.cloudflare.com/client/v4';

  constructor(config: CloudflareConfig) {
    this.apiToken = config.apiToken;
    this.domain = config.domain;
    this.zoneId = config.zoneId || null;
  }

  /**
   * Make authenticated request to Cloudflare API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiToken}`,
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
      const error = await response.json();
      throw new Error(
        `Cloudflare API error: ${error.errors?.[0]?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get zone ID for domain
   */
  async getZoneId(): Promise<string> {
    if (this.zoneId) {
      return this.zoneId;
    }

    const result = await this.makeRequest('GET', `/zones?name=${this.domain}`);

    if (!result.result || result.result.length === 0) {
      throw new Error(`Zone not found for domain ${this.domain}`);
    }

    this.zoneId = result.result[0].id;
    return this.zoneId;
  }

  /**
   * Get DNS records for the domain
   */
  async getRecords(): Promise<any[]> {
    const zoneId = await this.getZoneId();
    const result = await this.makeRequest('GET', `/zones/${zoneId}/dns_records`);
    
    return result.result.map((record: any) => ({
      id: record.id,
      name: record.name.replace(`.${this.domain}`, '').replace(this.domain, '@'),
      type: record.type,
      data: record.content,
      ttl: record.ttl,
      priority: record.priority,
    }));
  }

  /**
   * Add a single DNS record
   */
  async addRecord(record: {
    name: string;
    type: string;
    data: string;
    ttl?: number;
    priority?: number;
  }): Promise<void> {
    const zoneId = await this.getZoneId();
    
    const body: Record<string, any> = {
      type: record.type,
      name: record.name === '@' ? this.domain : `${record.name}.${this.domain}`,
      content: record.data,
      ttl: record.ttl || 1,
    };

    if (record.priority) {
      body.priority = record.priority;
    }

    await this.makeRequest('POST', `/zones/${zoneId}/dns_records`, body);
  }

  /**
   * Add multiple DNS records
   */
  async addRecords(records: Array<{
    name: string;
    type: string;
    data: string;
    ttl?: number;
    priority?: number;
  }>): Promise<void> {
    for (const record of records) {
      await this.addRecord(record);
    }
  }

  /**
   * Update DNS record
   */
  async updateRecord(
    recordId: string,
    record: {
      name: string;
      type: string;
      data: string;
      ttl?: number;
      priority?: number;
    }
  ): Promise<void> {
    const zoneId = await this.getZoneId();
    
    const body: Record<string, any> = {
      type: record.type,
      name: record.name === '@' ? this.domain : `${record.name}.${this.domain}`,
      content: record.data,
      ttl: record.ttl || 1,
    };

    if (record.priority) {
      body.priority = record.priority;
    }

    await this.makeRequest('PUT', `/zones/${zoneId}/dns_records/${recordId}`, body);
  }

  /**
   * Delete DNS record
   */
  async deleteRecord(recordId: string): Promise<void> {
    const zoneId = await this.getZoneId();
    await this.makeRequest('DELETE', `/zones/${zoneId}/dns_records/${recordId}`);
  }

  /**
   * Delete record by name and type
   */
  async deleteRecordByNameType(name: string, type: string): Promise<void> {
    const records = await this.getRecords();
    const record = records.find(r => r.name === name && r.type === type);
    
    if (record) {
      await this.deleteRecord(record.id);
    }
  }

  /**
   * Get zone info
   */
  async getZoneInfo(): Promise<any> {
    const zoneId = await this.getZoneId();
    const result = await this.makeRequest('GET', `/zones/${zoneId}`);
    return result.result;
  }

  /**
   * Get nameservers for zone
   */
  async getNameservers(): Promise<string[]> {
    const zoneInfo = await this.getZoneInfo();
    return zoneInfo.name_servers || [];
  }
}

/**
 * Cloudflare OAuth Client for API access
 */
export class CloudflareOAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
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
      scope: 'zone:dns:edit',
    });

    return `https://dash.cloudflare.com/oauth2/auth?${params.toString()}`;
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

    const response = await fetch('https://oauth.cloudflare.com/oauth/token', {
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

  /**
   * Validate API token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
