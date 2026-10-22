// Runtime validation coverage for multipart payment submission behavior.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customer payment submission', () => {
  it.each([
    ['item reservation', 'submitReservationPayment', '/api/reservations/reservation-id/payment'],
    ['service booking', 'submitServiceRequestPayment', '/api/service-requests/service-id/payment'],
  ])('sends a receipt and reference for a %s', async (_label, method, expectedPath) => {
    const proof = new Blob(['receipt'], { type: 'image/png' });
    vi.stubGlobal('localStorage', { getItem: () => 'customer-token', removeItem: vi.fn() });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    }));

    const result = await api[method](
      method === 'submitReservationPayment' ? 'reservation-id' : 'service-id',
      { reference: '1234567890', proof },
    );

    expect(result.success).toBe(true);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain(expectedPath);
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('reference')).toBe('1234567890');
    expect(options.body.get('proof').type).toBe('image/png');
  });
});
