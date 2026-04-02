/**
 * Google Domains DNS API Client
 * Handles DNS record operations via Google Domains API
 */

export interface GoogleDomainsConfig {
  accessToken: string;
  domain: string;
  projectId?: string;
}

export class GoogleDomainsDNSClient {
  private accessToken: string;
  private domain: string;
  private projectId: string;
  private baseUrl: string = 'https://domains.googleapis.com/v1';

  constructor(config: GoogleDomainsConfig) {
    this.accessToken = config.accessToken;
    this.domain = config.domain;
    this.projectId = config.projectId || 'default';
  }

  /**
   * Make authenticated request to Google Domains API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
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
        `Google Domains API error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get DNS settings for domain
   */
  async getDNSSettings(): Promise<any> {
    const result = await this.makeRequest(
      'GET',
      `/projects/${this.projectId}/locations/global/registrations/${this.domain}:retrieveDnsSettings`
    );

    return result;
  }

  /**
   * Get custom DNS records
   */
  async getRecords(): Promise<any[]> {
    const settings = await this.getDNSSettings();
    
    if (!settings.dnsSettings || !settings.dnsSettings.customDns) {
      return [];
    }

    return settings.dnsSettings.customDns.nameServers.map((ns: string) => ({
      type: 'NS',
      data: ns,
    }));
  }

  /**
   * Update DNS settings
   */
  async updateDNSSettings(nameServers: string[]): Promise<void> {
    const body = {
      dnsSettings: {
        customDns: {
          nameServers,
        },
      },
      updateMask: 'dnsSettings.customDns.nameServers',
    };

    await this.makeRequest(
      'PATCH',
      `/projects/${this.projectId}/locations/global/registrations/${this.domain}:updateDnsSettings`,
      body
    );
  }

  /**
   * Get DNSSEC settings
   */
  async getDNSSECSettings(): Promise<any> {
    const settings = await this.getDNSSettings();
    return settings.dnsSettings?.dnssecConfig;
  }

  /**
   * Enable DNSSEC
   */
  async enableDNSSEC(): Promise<void> {
    const body = {
      dnsSettings: {
        dnssecConfig: {
          state: 'on',
        },
      },
      updateMask: 'dnsSettings.dnssecConfig.state',
    };

    await this.makeRequest(
      'PATCH',
      `/projects/${this.projectId}/locations/global/registrations/${this.domain}:updateDnsSettings`,
      body
    );
  }

  /**
   * Get domain info
   */
  async getDomainInfo(): Promise<any> {
    const result = await this.makeRequest(
      'GET',
      `/projects/${this.projectId}/locations/global/registrations/${this.domain}`
    );

    return result;
  }

  /**
   * List all registrations
   */
  async listRegistrations(): Promise<any[]> {
    const result = await this.makeRequest(
      'GET',
      `/projects/${this.projectId}/locations/global/registrations`
    );

    return result.registrations || [];
  }
}

/**
 * Google Domains OAuth Client for API access
 */
export class GoogleDomainsOAuthClient {
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
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
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
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
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
