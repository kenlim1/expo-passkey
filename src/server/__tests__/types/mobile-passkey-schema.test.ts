/**
 * @file Tests for the mobilePasskey schema
 * @description Tests specifically for the Mobile Passkey DB model
 */

import { mobilePasskeySchema } from '../../../types';

describe('MobilePasskey Schema Tests', () => {
  describe('mobilePasskeySchema validation', () => {
    // Test the default function for createdAt
    it('should apply default Date function for createdAt when missing', () => {
      const passkey = {
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        lastUsed: '2023-01-01T00:00:00Z',
        status: 'active' as const,
        // No createdAt
        updatedAt: new Date(),
      };

      const result = mobilePasskeySchema.safeParse(passkey);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify the default function created a Date
        expect(result.data.createdAt).toBeInstanceOf(Date);

        // Should be a recent date (within the last second)
        const now = new Date();
        const diff = now.getTime() - result.data.createdAt.getTime();
        expect(diff).toBeLessThan(1000);
      }
    });

    // Test the default function for updatedAt
    it('should apply default Date function for updatedAt when missing', () => {
      const passkey = {
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        lastUsed: '2023-01-01T00:00:00Z',
        status: 'active' as const,
        createdAt: new Date(),
        // No updatedAt
      };

      const result = mobilePasskeySchema.safeParse(passkey);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify the default function created a Date
        expect(result.data.updatedAt).toBeInstanceOf(Date);

        // Should be a recent date (within the last second)
        const now = new Date();
        const diff = now.getTime() - result.data.updatedAt.getTime();
        expect(diff).toBeLessThan(1000);
      }
    });

    // Test status default function
    it('should apply default active value for status when missing', () => {
      const passkey = {
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        lastUsed: '2023-01-01T00:00:00Z',
        // No status
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = mobilePasskeySchema.safeParse(passkey);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify default status is 'active'
        expect(result.data.status).toBe('active');
      }
    });

    // Test multiple defaults at once
    it('should apply all defaults simultaneously when fields are missing', () => {
      const minimalPasskey = {
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        lastUsed: '2023-01-01T00:00:00Z',
        // Missing status, createdAt, updatedAt
      };

      const result = mobilePasskeySchema.safeParse(minimalPasskey);
      expect(result.success).toBe(true);

      if (result.success) {
        // Verify all defaults were applied
        expect(result.data.status).toBe('active');
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });
  });
});
