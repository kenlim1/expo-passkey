/**
 * @file Schema definitions
 * @description Zod schema definitions for request validation
 */

import { z } from 'zod';

/**
 * Schema for passkey registration requests
 */
export const registerPasskeySchema = z.object({
  userId: z.string(),
  deviceId: z.string(),
  platform: z.string(),
  metadata: z
    .object({
      deviceName: z.string().optional(),
      deviceModel: z.string().optional(),
      appVersion: z.string().optional(),
      manufacturer: z.string().optional(),
      biometricType: z.string().optional(),
      lastLocation: z.string().optional(),
    })
    .optional(),
});

/**
 * Schema for passkey authentication requests
 */
export const authenticatePasskeySchema = z.object({
  deviceId: z.string(),
  metadata: z
    .object({
      lastLocation: z.string().optional(),
      appVersion: z.string().optional(),
      deviceModel: z.string().optional(),
      manufacturer: z.string().optional(),
      biometricType: z.string().optional(),
    })
    .optional(),
});

/**
 * Schema for list passkeys query parameters
 */
export const listPasskeysQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
});

/**
 * Schema for list passkeys URL parameters
 */
export const listPasskeysParamsSchema = z.object({
  userId: z.string({
    description: 'User ID to fetch passkeys for',
    required_error: 'User ID is required',
  }),
});

/**
 * Schema for passkey revocation requests
 */
export const revokePasskeySchema = z.object({
  userId: z.string(),
  deviceId: z.string(),
  reason: z.string().optional(),
});
