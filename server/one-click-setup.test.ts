import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectDomainRegistrar,
  generateDNSRecords,
  oneClickSetup,
} from './one-click-setup';

describe('One-Click Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DNS Record Generation', () => {
    it('should generate Office 365 DNS records', () => {
      const records = generateDNSRecords('gareversal.com', 'office365');

      expect(records).toHaveLength(5);
      expect(records[0].type).toBe('MX');
      expect(records[0].value).toContain('outlook.com');
      expect(records[1].type).toBe('TXT');
      expect(records[1].value).toContain('outlook.com');
    });

    it('should generate Gmail DNS records', () => {
      const records = generateDNSRecords('example.com', 'gmail');

      expect(records).toHaveLength(4);
      expect(records[0].type).toBe('MX');
      expect(records[0].value).toContain('google.com');
    });

    it('should include SPF record', () => {
      const records = generateDNSRecords('gareversal.com', 'office365');
      const spfRecord = records.find((r) => r.type === 'TXT' && r.value.startsWith('v=spf1'));

      expect(spfRecord).toBeDefined();
      expect(spfRecord?.value).toContain('outlook.com');
    });

    it('should include DKIM records for Office 365', () => {
      const records = generateDNSRecords('gareversal.com', 'office365');
      const dkimRecords = records.filter((r) => r.type === 'CNAME' && r.name.includes('_domainkey'));

      expect(dkimRecords).toHaveLength(2);
      expect(dkimRecords[0].name).toBe('selector1._domainkey');
      expect(dkimRecords[1].name).toBe('selector2._domainkey');
    });

    it('should include DMARC record', () => {
      const records = generateDNSRecords('gareversal.com', 'office365');
      const dmarcRecord = records.find((r) => r.type === 'TXT' && r.name === '_dmarc');

      expect(dmarcRecord).toBeDefined();
      expect(dmarcRecord?.value).toContain('DMARC1');
    });
  });

  describe('Domain Registrar Detection', () => {
    it('should detect domain registrar', async () => {
      const registrar = await detectDomainRegistrar('gareversal.com');

      expect(registrar).toBeDefined();
      expect(typeof registrar).toBe('string');
      expect(registrar.length).toBeGreaterThan(0);
    });

    it('should return lowercase registrar name', async () => {
      const registrar = await detectDomainRegistrar('example.com');

      expect(registrar).toBe(registrar.toLowerCase());
    });
  });

  describe('One-Click Setup Configuration', () => {
    it('should validate Office 365 setup config', async () => {
      const result = await oneClickSetup({
        domain: 'gareversal.com',
        email: 'crypto@gareversal.com',
        emailProvider: 'office365',
      });

      expect(result).toBeDefined();
      expect(result.domain).toBe('gareversal.com');
      expect(result.email).toBe('crypto@gareversal.com');
      expect(result.emailProvider).toBe('office365');
    });

    it('should include DNS records in result', async () => {
      const result = await oneClickSetup({
        domain: 'gareversal.com',
        email: 'crypto@gareversal.com',
        emailProvider: 'office365',
      });

      expect(result.dnsRecords).toBeDefined();
      expect(Array.isArray(result.dnsRecords)).toBe(true);
    });

    it('should return message on completion', async () => {
      const result = await oneClickSetup({
        domain: 'gareversal.com',
        email: 'crypto@gareversal.com',
        emailProvider: 'office365',
      });

      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Email Provider Configuration', () => {
    it('should support Office 365 provider', async () => {
      const result = await oneClickSetup({
        domain: 'gareversal.com',
        email: 'crypto@gareversal.com',
        emailProvider: 'office365',
      });

      expect(result.emailProvider).toBe('office365');
    });

    it('should support Gmail provider', async () => {
      const result = await oneClickSetup({
        domain: 'example.com',
        email: 'admin@example.com',
        emailProvider: 'gmail',
      });

      expect(result.emailProvider).toBe('gmail');
    });

    it('should include verification status', async () => {
      const result = await oneClickSetup({
        domain: 'gareversal.com',
        email: 'crypto@gareversal.com',
        emailProvider: 'office365',
      });

      expect(result.verificationStatus).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid domain gracefully', async () => {
      const result = await oneClickSetup({
        domain: '',
        email: 'test@example.com',
        emailProvider: 'office365',
      });

      // Should still return a result object
      expect(result).toBeDefined();
    });

    it('should handle invalid email gracefully', async () => {
      const result = await oneClickSetup({
        domain: 'example.com',
        email: 'invalid-email',
        emailProvider: 'office365',
      });

      expect(result).toBeDefined();
    });
  });
});
