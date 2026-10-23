import { describe, expect, it, vi } from 'vitest';
import validation from '../middleware/validate.js';

const { validateCustomerProfile } = validation;

function validateProfile(body) {
  const req = { body };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };
  const next = vi.fn();
  validateCustomerProfile(req, res, next);
  return { res, next };
}

describe('customer profile phone validation', () => {
  it.each(['+63 947 188 6228', '09471886228', '9471886228'])(
    'accepts a Philippine mobile number in %s format',
    (phoneNumber) => {
      const { res, next } = validateProfile({ firstName: 'Alex', lastName: 'Rider', phoneNumber });
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    },
  );

  it('rejects a non-mobile phone number', () => {
    const { res, next } = validateProfile({ firstName: 'Alex', lastName: 'Rider', phoneNumber: '02 8123 4567' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Enter a valid Philippine mobile number.' });
    expect(next).not.toHaveBeenCalled();
  });
});
