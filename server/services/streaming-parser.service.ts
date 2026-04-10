import { Readable } from 'stream';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  rawData: string;
}

interface ParseResult {
  totalRows: number;
  rows: ParsedRow[];
  schema: Record<string, string>;
  errors: string[];
}

export class StreamingParserService {
  /**
   * Parse CSV stream from file path
   */
  async parseCSVStream(filePath: string, previewRows?: number): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const rows: ParsedRow[] = [];
      const schema: Record<string, string> = {};
      const errors: string[] = [];
      let rowNumber = 0;

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;

          // Stop if preview limit reached
          if (previewRows && rowNumber > previewRows) {
            return;
          }

          try {
            // Detect schema on first row
            if (rowNumber === 1) {
              Object.keys(row).forEach((key) => {
                const value = row[key];
                schema[key] = this.detectFieldType(value);
              });
            }

            rows.push({
              rowNumber,
              data: row,
              rawData: JSON.stringify(row),
            });
          } catch (error) {
            errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`);
          }
        })
        .on('end', () => {
          resolve({
            totalRows: rowNumber,
            rows,
            schema,
            errors,
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Parse JSON array from file
   */
  async parseJSONStream(filePath: string, previewRows?: number): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      try {
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (!Array.isArray(data)) {
          throw new Error('JSON must be an array of objects');
        }

        const rows: ParsedRow[] = [];
        const schema: Record<string, string> = {};
        const errors: string[] = [];

        data.forEach((item, index) => {
          const rowNumber = index + 1;

          if (previewRows && rowNumber > previewRows) {
            return;
          }

          try {
            if (rowNumber === 1) {
              Object.keys(item).forEach((key) => {
                schema[key] = this.detectFieldType(item[key]);
              });
            }

            rows.push({
              rowNumber,
              data: item,
              rawData: JSON.stringify(item),
            });
          } catch (error) {
            errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`);
          }
        });

        resolve({
          totalRows: data.length,
          rows,
          schema,
          errors,
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Detect field data type
   */
  detectFieldType(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'string';
    }

    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'string') {
      // Check for date patterns
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) {
        return 'date';
      }

      // Check for email
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'email';
      }

      // Check for phone
      if (/^[\d\s\-\+\(\)]+$/.test(value) && value.length >= 10) {
        return 'phone';
      }

      // Check for URL
      if (/^https?:\/\//.test(value)) {
        return 'url';
      }

      // Check for JSON
      if ((value.startsWith('[') || value.startsWith('{')) && (value.endsWith(']') || value.endsWith('}'))) {
        return 'json';
      }

      return 'string';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (typeof value === 'object') {
      return 'object';
    }

    return 'string';
  }

  /**
   * Detect source CRM system based on column names
   */
  detectSourceSystem(schema: Record<string, string>): string {
    const keys = Object.keys(schema).map((k) => k.toLowerCase());

    // HubSpot detection
    if (keys.includes('hubspot id') || keys.includes('hs_object_id') || keys.includes('lifecyclestage')) {
      return 'hubspot';
    }

    // Salesforce detection
    if (keys.includes('sfid') || keys.includes('recordtypeid') || keys.includes('isdeleted')) {
      return 'salesforce';
    }

    // Pipedrive detection
    if (keys.includes('deal_id') || keys.includes('person_id') || keys.includes('org_id')) {
      return 'pipedrive';
    }

    // Zoho detection
    if (keys.includes('zoho_id') || keys.includes('record_id')) {
      return 'zoho';
    }

    // Keap detection
    if (keys.includes('contact_id') || keys.includes('company_id')) {
      return 'keap';
    }

    return 'custom';
  }

  /**
   * Preview first N rows from file
   */
  async previewCSVStream(filePath: string, previewRows: number = 5): Promise<ParseResult> {
    return this.parseCSVStream(filePath, previewRows);
  }
}
