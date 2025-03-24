/**
 * @file Device information and ID management utilities
 * @module expo-passkey/client/utils/device
 */

import type { DeviceInfo, ExpoPasskeyClientOptions } from '../../types';
import { ERROR_CODES, PasskeyError } from '../../types/errors';

import { checkBiometricSupport } from './biometrics';
import { loadExpoModules } from './modules';
import { getStorageKeys } from './storage';

// Helper function to get modules only when needed
function getModules() {
  return loadExpoModules();
}

/**
 * Gets or generates a device identifier
 * @param options Client options with storage prefix
 * @returns Promise resolving to a device ID
 * @throws {PasskeyError} If device ID generation fails
 */
export async function getDeviceId(options: ExpoPasskeyClientOptions = {}): Promise<string> {
  try {
    const { Platform, Application, Device, SecureStore } = getModules();
    const KEYS = getStorageKeys(options);

    // First try to get from secure storage
    try {
      const storedId = await SecureStore.getItemAsync(KEYS.DEVICE_ID);
      if (storedId) {
        return storedId;
      }
    } catch (storageError) {
      console.warn('Failed to retrieve stored device ID:', storageError);
      // Continue to generate a new ID
    }

    let deviceId: string;

    // Platform-specific ID generation
    if (Platform.OS === 'ios') {
      try {
        const iosId = await Application.getIosIdForVendorAsync();
        if (iosId) {
          deviceId = iosId;
        } else {
          deviceId = await generateFallbackDeviceId();
        }
      } catch (iosError) {
        console.warn('Failed to get iOS vendor ID:', iosError);
        deviceId = await generateFallbackDeviceId();
      }
    } else if (Platform.OS === 'android') {
      try {
        const androidId = Application.getAndroidId();
        if (!androidId) {
          throw new Error('Android ID is empty or null');
        }
        deviceId = androidId;
      } catch (androidIdError) {
        console.warn('Failed to get Android ID:', androidIdError);

        // Fallback to stored unique ID if getAndroidId fails
        const androidUniqueIdKey = `${options.storagePrefix || '_better-auth'}.ANDROID_UNIQUE_ID`;
        try {
          const androidUniqueId = await SecureStore.getItemAsync(androidUniqueIdKey);
          if (androidUniqueId) {
            deviceId = androidUniqueId;
          } else {
            throw new Error('No stored Android unique ID');
          }
        } catch (uniqueIdError) {
          console.warn('Failed to get stored Android unique ID:', uniqueIdError);

          // Generate a fallback ID if all else fails
          try {
            const randomId = await generateFallbackDeviceId();

            // Add device-specific information
            const deviceInfo = {
              brand: Device.brand || '',
              modelName: Device.modelName || '',
              osBuildId: Device.osBuildId || '',
            };

            // Combine random ID with device info
            const infoString = Object.values(deviceInfo).filter(Boolean).join('-');
            deviceId = infoString ? `${randomId}-${infoString}` : randomId;

            // Save for future use
            try {
              await SecureStore.setItemAsync(androidUniqueIdKey, deviceId);
            } catch (saveError) {
              console.warn('Failed to save Android unique ID:', saveError);
              // Continue anyway - we have a valid ID
            }
          } catch (fallbackError) {
            console.error('Failed to generate fallback Android ID:', fallbackError);
            // Last resort - use a timestamp-based ID
            deviceId = `android-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
          }
        }
      }
    } else {
      // For unsupported platforms, use fallback instead of throwing
      try {
        deviceId = await generateFallbackDeviceId();
      } catch (fallbackError) {
        console.error('Failed to generate fallback ID for unsupported platform:', fallbackError);
        // Last resort - use a timestamp-based ID
        deviceId = `${Platform.OS || 'unknown'}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }
    }

    // Store the ID for future use
    try {
      await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId);
    } catch (saveError) {
      console.warn('Failed to save device ID:', saveError);
      // Continue anyway - we have a valid ID
    }

    return deviceId;
  } catch (error) {
    console.error('Unexpected error in getDeviceId:', error);

    // This should never happen in production, but as a last resort:
    try {
      const randomId = await generateFallbackDeviceId();
      return randomId;
    } catch (fallbackError) {
      console.error('Failed to generate fallback ID after catastrophic error:', fallbackError);
      // Ultimate fallback - simple timestamp + random
      return `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
  }
}

/**
 * Generates a fallback device identifier using crypto random values
 * @returns Promise resolving to a random device ID
 */
export async function generateFallbackDeviceId(): Promise<string> {
  try {
    const { Platform, Crypto } = getModules();

    try {
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      const deviceId = [...new Uint8Array(randomBytes)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `${Platform.OS}-${deviceId}`;
    } catch (cryptoError) {
      console.warn('Failed to generate random bytes:', cryptoError);
      // Fallback to Math.random if crypto fails
      const randomParts = [];
      for (let i = 0; i < 16; i++) {
        randomParts.push(
          Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
        );
      }
      return `${Platform.OS}-${randomParts.join('')}`;
    }
  } catch (error) {
    console.error('Failed to generate fallback device ID:', error);
    throw new PasskeyError(ERROR_CODES.DEVICE.ID_GENERATION_FAILED, 'Failed to generate device ID');
  }
}

/**
 * Gets comprehensive device information including biometric support
 * @param options Client options with storage prefix
 * @returns Promise resolving to device information
 */
export async function getDeviceInfo(options: ExpoPasskeyClientOptions = {}): Promise<DeviceInfo> {
  try {
    const { Platform, Device, Application } = getModules();

    let deviceId: string;
    try {
      deviceId = await getDeviceId(options);
    } catch (deviceIdError) {
      console.error('Failed to get device ID:', deviceIdError);
      // Fallback to timestamp-based ID as last resort
      deviceId = `error-${Date.now()}`;
    }

    let biometricSupport;
    try {
      biometricSupport = await checkBiometricSupport();
    } catch (biometricError) {
      console.error('Failed to check biometric support:', biometricError);
      // Provide default biometric info indicating it's not available
      biometricSupport = {
        isSupported: false,
        isEnrolled: false,
        availableTypes: [],
        authenticationType: 'None',
        error: 'Failed to check biometric support',
        platformDetails: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      };
    }

    return {
      deviceId,
      platform: Platform.OS,
      model: Device.modelName,
      manufacturer: Device.manufacturer,
      osVersion: Device.osVersion || Platform.Version.toString(),
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      biometricSupport,
    };
  } catch (error) {
    console.error('Unexpected error in getDeviceInfo:', error);
    throw new PasskeyError(
      ERROR_CODES.ENVIRONMENT.NOT_SUPPORTED,
      'Failed to retrieve device information'
    );
  }
}

/**
 * Clears stored device ID
 * @param options Client options with storage prefix
 * @returns Promise resolving when device ID is cleared
 */
export async function clearDeviceId(options: ExpoPasskeyClientOptions = {}): Promise<void> {
  try {
    const { SecureStore } = getModules();
    const KEYS = getStorageKeys(options);
    const androidUniqueIdKey = `${options.storagePrefix || '_better-auth'}.ANDROID_UNIQUE_ID`;

    // Use Promise.allSettled to ensure both operations are attempted even if one fails
    await Promise.allSettled([
      SecureStore.deleteItemAsync(KEYS.DEVICE_ID),
      SecureStore.deleteItemAsync(androidUniqueIdKey),
    ]);
  } catch (error) {
    console.error('Error clearing device ID:', error);
    // Don't rethrow - we want the UI to continue even if clearing fails
  }
}
