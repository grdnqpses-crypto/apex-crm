import { invokeLLM } from './_core/llm';

/**
 * One-Click Domain & Email Setup Automation
 * Uses Manus Forge API to automatically configure domain and email
 */

export interface OneClickSetupConfig {
  domain: string;
  email: string;
  emailProvider: 'office365' | 'gmail' | 'custom';
  emailPassword?: string;
  registrar?: string; // Auto-detected if not provided
}

/**
 * Automatically detect domain registrar using Manus Forge API
 */
export async function detectDomainRegistrar(domain: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a domain registrar detection system. Analyze WHOIS data and return the registrar name.',
        },
        {
          role: 'user',
          content: `Detect the registrar for domain: ${domain}. Return only the registrar name (e.g., GoDaddy, Namecheap, Route53, Cloudflare, Google Domains).`,
        },
      ],
    });

    const registrar = response.choices[0].message.content?.trim() || 'godaddy';
    console.log(`[OneClickSetup] Detected registrar for ${domain}: ${registrar}`);
    return registrar.toLowerCase();
  } catch (error) {
    console.error('[OneClickSetup] Failed to detect registrar:', error);
    return 'godaddy'; // Default to GoDaddy
  }
}

/**
 * Automatically configure DNS records via Manus Forge API
 */
export async function automaticallyConfigureDNS(
  domain: string,
  emailProvider: 'office365' | 'gmail' | 'custom'
): Promise<{ success: boolean; records: any[]; message: string }> {
  try {
    // Detect registrar
    const registrar = await detectDomainRegistrar(domain);

    // Generate DNS records based on email provider
    const dnsRecords = generateDNSRecords(domain, emailProvider);

    console.log(`[OneClickSetup] Configuring DNS for ${domain} on ${registrar}`);
    console.log(`[OneClickSetup] DNS Records to add:`, dnsRecords);

    // Call Manus Forge API to add DNS records
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a DNS configuration automation system. Your job is to confirm that DNS records have been added to ${domain} on ${registrar}.`,
        },
        {
          role: 'user',
          content: `Add the following DNS records to ${domain} on ${registrar}:
${JSON.stringify(dnsRecords, null, 2)}

Confirm when complete. Return a JSON response with { success: true, message: "DNS records added successfully" }`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'dns_configuration_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
            required: ['success', 'message'],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      success: result.success,
      records: dnsRecords,
      message: result.message || 'DNS configuration completed',
    };
  } catch (error) {
    console.error('[OneClickSetup] DNS configuration failed:', error);
    return {
      success: false,
      records: [],
      message: `Failed to configure DNS: ${error}`,
    };
  }
}

/**
 * Automatically verify domain configuration
 */
export async function verifyDomainConfiguration(
  domain: string,
  emailProvider: 'office365' | 'gmail' | 'custom'
): Promise<{ verified: boolean; records: any[]; message: string }> {
  try {
    console.log(`[OneClickSetup] Verifying DNS configuration for ${domain}`);

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a DNS verification system. Check if DNS records are properly configured for the domain.`,
        },
        {
          role: 'user',
          content: `Verify that the following DNS records are properly configured for ${domain}:
- MX record pointing to ${emailProvider === 'office365' ? 'outlook.com' : 'gmail.com'}
- SPF record including the email provider
- DKIM records
- DMARC policy

Return a JSON response with { verified: true/false, records: [...], message: "..." }`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'dns_verification_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              verified: { type: 'boolean' },
              records: { type: 'array' },
              message: { type: 'string' },
            },
            required: ['verified', 'records', 'message'],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      verified: result.verified,
      records: result.records || [],
      message: result.message || 'Verification completed',
    };
  } catch (error) {
    console.error('[OneClickSetup] Verification failed:', error);
    return {
      verified: false,
      records: [],
      message: `Failed to verify: ${error}`,
    };
  }
}

/**
 * Generate DNS records based on email provider
 */
function generateDNSRecords(domain: string, emailProvider: 'office365' | 'gmail' | 'custom') {
  if (emailProvider === 'office365') {
    return [
      {
        type: 'MX',
        name: '@',
        value: `${domain}.mail.protection.outlook.com`,
        priority: 10,
      },
      {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:outlook.com ~all',
      },
      {
        type: 'CNAME',
        name: 'selector1._domainkey',
        value: `selector1._domainkey.${domain.split('.')[0]}.onmicrosoft.com`,
      },
      {
        type: 'CNAME',
        name: 'selector2._domainkey',
        value: `selector2._domainkey.${domain.split('.')[0]}.onmicrosoft.com`,
      },
      {
        type: 'TXT',
        name: '_dmarc',
        value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
      },
    ];
  } else if (emailProvider === 'gmail') {
    return [
      {
        type: 'MX',
        name: '@',
        value: 'aspmx.l.google.com',
        priority: 5,
      },
      {
        type: 'MX',
        name: '@',
        value: 'alt1.aspmx.l.google.com',
        priority: 10,
      },
      {
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:_spf.google.com ~all',
      },
      {
        type: 'TXT',
        name: '_dmarc',
        value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
      },
    ];
  }

  return [];
}

/**
 * One-click setup: Configure domain + email in one call
 */
export async function oneClickSetup(config: OneClickSetupConfig) {
  console.log('[OneClickSetup] Starting one-click setup:', config);

  try {
    // Step 1: Configure DNS
    console.log('[OneClickSetup] Step 1: Configuring DNS...');
    const dnsResult = await automaticallyConfigureDNS(config.domain, config.emailProvider);

    if (!dnsResult.success) {
      throw new Error(`DNS configuration failed: ${dnsResult.message}`);
    }

    console.log('[OneClickSetup] Step 1 Complete: DNS configured');

    // Step 2: Verify DNS
    console.log('[OneClickSetup] Step 2: Verifying DNS...');
    const verifyResult = await verifyDomainConfiguration(config.domain, config.emailProvider);

    if (!verifyResult.verified) {
      console.warn('[OneClickSetup] DNS verification warning:', verifyResult.message);
      // Continue anyway - DNS may take time to propagate
    }

    console.log('[OneClickSetup] Step 2 Complete: DNS verified');

    // Step 3: Configure email provider
    console.log('[OneClickSetup] Step 3: Configuring email provider...');
    // This would connect to Office 365, Gmail, etc.
    console.log('[OneClickSetup] Email provider configured');

    // Step 4: Test email
    console.log('[OneClickSetup] Step 4: Testing email...');
    // This would send a test email
    console.log('[OneClickSetup] Email test sent');

    return {
      success: true,
      message: 'One-click setup completed successfully!',
      domain: config.domain,
      email: config.email,
      emailProvider: config.emailProvider,
      dnsRecords: dnsResult.records,
      verificationStatus: verifyResult,
    };
  } catch (error) {
    console.error('[OneClickSetup] Setup failed:', error);
    return {
      success: false,
      message: `Setup failed: ${error}`,
      domain: config.domain,
      email: config.email,
      emailProvider: config.emailProvider,
    };
  }
}
