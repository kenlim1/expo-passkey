/**
 * @file Environment detection utilities
 * @module expo-passkey/utils/environment
 */

/**
 * Checks if code is running in an Expo environment
 * @returns True if running in an Expo environment
 */
export function isExpoEnvironment(): boolean {
  try {
    // Check if React Native is available
    const reactNative = require("react-native");
    if (!reactNative) return false;

    // Check if Expo SDK is available
    const expo = require("expo");
    if (!expo) return false;

    // Check for required Expo modules
    const expoModulesAvailable = [
      "expo-application",
      "expo-device",
      "expo-local-authentication",
      "expo-secure-store",
      "expo-crypto",
    ].every((module) => {
      try {
        require(module);
        return true;
      } catch {
        return false;
      }
    });

    return expoModulesAvailable;
  } catch (_e) {
    return false;
  }
}

/**
 * Validates that we're in a supported Expo environment
 * @returns True if environment is valid for passkey usage
 * @throws Error if not running in a supported environment
 */
export function validateExpoEnvironment(): boolean {
  if (!isExpoEnvironment()) {
    throw new Error(
      "Expo Passkey requires an Expo environment with all required modules installed. " +
        "This package cannot be used in web browsers or other non-Expo environments.",
    );
  }

  return true;
}

/**
 * Checks if the device platform is supported for passkeys
 * @param platform The platform to check
 * @param version The platform version
 * @returns True if the platform and version are supported
 */
export function isSupportedPlatform(
  platform: string,
  version: string | number,
): boolean {
  if (platform === "ios") {
    if (typeof version === "string") {
      // Make sure the version string contains only digits and decimal points
      if (!/^[0-9.]+$/.test(version)) {
        return false;
      }
      const iosVersion = parseInt(version, 10);
      return !isNaN(iosVersion) && iosVersion >= 16;
    }
    return typeof version === "number" && !isNaN(version) && version >= 16;
  }

  if (platform === "android") {
    // Android API level 29+ (Android 10+)
    return typeof version === "number" && version >= 29;
  }

  return false;
}
