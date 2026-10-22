// Runtime validation coverage for payment reference and receipt validation.
import { describe, expect, it } from 'vitest';
import paymentReceipt from '../utils/paymentReceipt.js';

const { validateReceipt, validateReference } = paymentReceipt;
const validPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=',
  'base64',
);

describe('payment reference validation', () => {
  it('accepts a 10-to-20 digit reference', () => {
    expect(validateReference('12345678901234567890')).toBe('12345678901234567890');
  });

  it.each(['123456789', '123456789012345678901', '12 34567890', 'reference1234'])(
    'rejects invalid reference %s',
    (reference) => {
      expect(() => validateReference(reference)).toThrow(/10 to 20 digits/);
    },
  );
});

describe('receipt validation', () => {
  it('accepts a PNG with a real PNG signature', () => {
    expect(() => validateReceipt({
      mimetype: 'image/png',
      size: validPng.length,
      buffer: validPng,
    })).not.toThrow();
  });

  it('rejects a file whose claimed type does not match its bytes', () => {
    expect(() => validateReceipt({
      mimetype: 'image/png',
      size: 8,
      buffer: Buffer.from('not-image'),
    })).toThrow(/real PNG or JPG/);
  });

  it('rejects receipts larger than 2 MB', () => {
    expect(() => validateReceipt({
      mimetype: 'image/png',
      size: 2 * 1024 * 1024 + 1,
      buffer: Buffer.alloc(8),
    })).toThrow(/2 MB or smaller/);
  });
});
