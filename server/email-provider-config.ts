/**
 * Email Provider Configuration System
 * Handles automated setup for Gmail, Office 365, and custom SMTP providers
 */

export type EmailProvider = "gmail" | "office365" | "custom_smtp";

export interface EmailProviderConfig {
  provider: EmailProvider;
  email: string;
  displayName?: string;
  // OAuth fields
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  // SMTP fields
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpTls?: boolean;
  // Metadata
  configuredAt: number;
  verifiedAt?: number;
  isVerified: boolean;
}

export interface EmailProviderSetupResult {
  success: boolean;
  provider: EmailProvider;
  email: string;
  message: string;
  config?: EmailProviderConfig;
  error?: string;
}

/**
 * Gmail OAuth Configuration
 * Uses Google's OAuth 2.0 flow for secure authentication
 */
export const GMAIL_CONFIG = {
  provider: "gmail" as const,
  name: "Gmail",
  icon: "📧",
  description: "Send emails from your Gmail account",
  authMethod: "oauth",
  scopes: [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
  ],
  setupSteps: [
    "Click 'Connect Gmail' below",
    "Sign in with your Google account",
    "Grant AXIOM permission to send emails",
    "Done! Your Gmail account is ready",
  ],
  learnMore: "https://support.google.com/mail/answer/7126229",
};

/**
 * Office 365 OAuth Configuration
 * Uses Microsoft's OAuth 2.0 flow for secure authentication
 */
export const OFFICE365_CONFIG = {
  provider: "office365" as const,
  name: "Office 365 / Outlook",
  icon: "📨",
  description: "Send emails from your Office 365 account",
  authMethod: "oauth",
  scopes: [
    "Mail.Send",
    "Mail.Read",
    "offline_access",
  ],
  setupSteps: [
    "Click 'Connect Office 365' below",
    "Sign in with your Microsoft account",
    "Grant AXIOM permission to send emails",
    "Done! Your Office 365 account is ready",
  ],
  learnMore: "https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app",
};

/**
 * Custom SMTP Configuration
 * For users with custom email providers or on-premises mail servers
 */
export const CUSTOM_SMTP_CONFIG = {
  provider: "custom_smtp" as const,
  name: "Custom SMTP",
  icon: "⚙️",
  description: "Connect any SMTP server (SendGrid, Postmark, etc.)",
  authMethod: "manual",
  setupSteps: [
    "Enter your SMTP server details",
    "Provide your SMTP username and password",
    "Click 'Verify Connection'",
    "Done! Your SMTP server is configured",
  ],
  commonProviders: [
    { name: "SendGrid", host: "smtp.sendgrid.net", port: 587 },
    { name: "Postmark", host: "smtp.postmarkapp.com", port: 587 },
    { name: "Mailgun", host: "smtp.mailgun.org", port: 587 },
    { name: "AWS SES", host: "email-smtp.{region}.amazonaws.com", port: 587 },
    { name: "Brevo (Sendinblue)", host: "smtp-relay.brevo.com", port: 587 },
  ],
  learnMore: "https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol",
};

/**
 * Get all available email providers
 */
export const EMAIL_PROVIDERS = [GMAIL_CONFIG, OFFICE365_CONFIG, CUSTOM_SMTP_CONFIG];

/**
 * Validate email configuration
 */
export function validateEmailConfig(config: EmailProviderConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.email || !config.email.includes("@")) {
    errors.push("Invalid email address");
  }

  if (config.provider === "gmail" || config.provider === "office365") {
    if (!config.accessToken) {
      errors.push("OAuth access token is required");
    }
  }

  if (config.provider === "custom_smtp") {
    if (!config.smtpHost) errors.push("SMTP host is required");
    if (!config.smtpPort) errors.push("SMTP port is required");
    if (!config.smtpUsername) errors.push("SMTP username is required");
    if (!config.smtpPassword) errors.push("SMTP password is required");
    if (config.smtpPort < 1 || config.smtpPort > 65535) {
      errors.push("SMTP port must be between 1 and 65535");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test email provider connection
 * Returns true if connection is successful
 */
export async function testEmailProviderConnection(config: EmailProviderConfig): Promise<boolean> {
  try {
    if (config.provider === "gmail" || config.provider === "office365") {
      // For OAuth providers, verify token is valid and not expired
      if (!config.accessToken) return false;
      if (config.expiresAt && config.expiresAt < Date.now()) {
        // Token expired - would need refresh
        return false;
      }
      return true;
    }

    if (config.provider === "custom_smtp") {
      // Test SMTP connection
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpTls !== false, // Default to TLS
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
      });

      // Verify connection
      await transporter.verify();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Email provider connection test failed:", error);
    return false;
  }
}

/**
 * Format SMTP config for display
 */
export function formatSmtpConfig(config: EmailProviderConfig): string {
  if (config.provider !== "custom_smtp") return "";
  return `${config.smtpHost}:${config.smtpPort} (${config.smtpTls ? "TLS" : "No TLS"})`;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(config: EmailProviderConfig): Partial<EmailProviderConfig> {
  return {
    provider: config.provider,
    email: config.email,
    displayName: config.displayName,
    configuredAt: config.configuredAt,
    verifiedAt: config.verifiedAt,
    isVerified: config.isVerified,
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpTls: config.smtpTls,
    // Sensitive fields are intentionally omitted
  };
}
