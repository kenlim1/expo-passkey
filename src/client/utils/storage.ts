/**
 * @file Storage utilities
 * @module expo-passkey/utils/storage
 */

import type { ExpoPasskeyClientOptions, StorageKeys } from '../../types/client';

/**
 * Gets storage keys based on the client options
 * @param options Client options with optional storage prefix
 * @returns Storage keys with the configured prefix
 */
export function getStorageKeys(options: ExpoPasskeyClientOptions = {}): StorageKeys {
  const prefix = options.storagePrefix || '_better-auth';

  return {
    DEVICE_ID: `${prefix}.device_id`,
    STATE: `${prefix}.passkey_state`,
    USER_ID: `${prefix}.user_id`,
  };
}
