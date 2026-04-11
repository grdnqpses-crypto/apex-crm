/**
 * EmailService - Self-contained email sending service
 * Supports: Nodemailer (SMTP), Resend API, SendGrid API
 * Works on any server - no external dependencies required
 */

import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailConfig {
  provider: "smtp" | "resend" | "sendgrid";
  // SMTP config
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpTls?: boolean;
  // Resend config
  resendApiKey?: string;
  // SendGrid config
  sendgridApiKey?: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send email using configured provider
   */
  async send(options: EmailOptions): Promise<{ id: string; success: boolean }> {
    console.log(`[EmailService] Sending email via ${this.config.provider}...`);
    console.log(`[EmailService] To: ${options.to}`);
    console.log(`[EmailService] From: ${options.from}`);
    console.log(`[EmailService] Subject: ${options.subject}`);

    switch (this.config.provider) {
      case "smtp":
        return this.sendViaSMTP(options);
      case "resend":
        return this.sendViaResend(options);
      case "sendgrid":
        return this.sendViaSendGrid(options);
      default:
        throw new Error(`Unknown email provider: ${this.config.provider}`);
    }
  }

  /**
   * Send via SMTP (Nodemailer)
   */
  private async sendViaSMTP(options: EmailOptions): Promise<{ id: string; success: boolean }> {
    if (!this.config.smtpHost || !this.config.smtpPort) {
      throw new Error("SMTP configuration incomplete");
    }

    const transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpPort === 465, // Use implicit TLS only for port 465
      auth: this.config.smtpUsername && this.config.smtpPassword ? {
        user: this.config.smtpUsername,
        pass: this.config.smtpPassword,
      } : undefined,
    });

    try {
      const info = await transporter.sendMail({
        from: options.from,
        to: options.to,
        cc: options.cc?.join(","),
        bcc: options.bcc?.join(","),
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log("[EmailService] SMTP email sent successfully:", info.messageId);
      return {
        id: info.messageId || "unknown",
        success: true,
      };
    } catch (error) {
      console.error("[EmailService] SMTP error:", error);
      throw error;
    }
  }

  /**
   * Send via Resend API
   */
  private async sendViaResend(options: EmailOptions): Promise<{ id: string; success: boolean }> {
    if (!this.config.resendApiKey) {
      throw new Error("Resend API key not configured");
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from,
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          replyTo: options.replyTo,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      console.log("[EmailService] Resend email sent successfully:", result.id);
      return {
        id: result.id,
        success: true,
      };
    } catch (error) {
      console.error("[EmailService] Resend error:", error);
      throw error;
    }
  }

  /**
   * Send via SendGrid API
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<{ id: string; success: boolean }> {
    if (!this.config.sendgridApiKey) {
      throw new Error("SendGrid API key not configured");
    }

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              cc: options.cc?.map(email => ({ email })),
              bcc: options.bcc?.map(email => ({ email })),
            },
          ],
          from: { email: options.from },
          replyTo: options.replyTo ? { email: options.replyTo } : undefined,
          subject: options.subject,
          content: [
            {
              type: "text/html",
              value: options.html,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${error}`);
      }

      const messageId = response.headers.get("x-message-id") || "unknown";
      console.log("[EmailService] SendGrid email sent successfully:", messageId);
      return {
        id: messageId,
        success: true,
      };
    } catch (error) {
      console.error("[EmailService] SendGrid error:", error);
      throw error;
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (this.config.provider === "smtp") {
        const transporter = nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpTls !== false,
          auth: this.config.smtpUsername && this.config.smtpPassword ? {
            user: this.config.smtpUsername,
            pass: this.config.smtpPassword,
          } : undefined,
        });

        await transporter.verify();
        console.log("[EmailService] SMTP connection verified");
        return true;
      } else if (this.config.provider === "resend") {
        const response = await fetch("https://api.resend.com/emails", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.resendApiKey}`,
          },
        });
        console.log("[EmailService] Resend API connection verified");
        return response.ok;
      } else if (this.config.provider === "sendgrid") {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "OPTIONS",
          headers: {
            Authorization: `Bearer ${this.config.sendgridApiKey}`,
          },
        });
        console.log("[EmailService] SendGrid API connection verified");
        return response.ok;
      }
      return false;
    } catch (error) {
      console.error("[EmailService] Connection test failed:", error);
      return false;
    }
  }
}

/**
 * Create EmailService instance from environment variables
 */
export function createEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER || "smtp") as "smtp" | "resend" | "sendgrid";

  const config: EmailConfig = {
    provider,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpTls: process.env.SMTP_TLS !== "false",
    resendApiKey: process.env.RESEND_API_KEY,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  };

  return new EmailService(config);
}
