import { describe, expect, it } from 'vitest';

import { decodeSafeRedirect } from '../safe-redirect';

describe('decodeSafeRedirect', () => {
  it('decodes an internal redirect path', () => {
    expect(decodeSafeRedirect('%2Fpayment%2Forder%3Fid%3D1')).toBe('/payment/order?id=1');
  });

  it('rejects external redirect URLs', () => {
    expect(decodeSafeRedirect('https%3A%2F%2Fevil.example')).toBe('');
    expect(decodeSafeRedirect('%2F%2Fevil.example')).toBe('');
  });

  it('falls back when redirect encoding is malformed', () => {
    expect(decodeSafeRedirect('%E0%A4%A', '/workspace')).toBe('/workspace');
  });
});
