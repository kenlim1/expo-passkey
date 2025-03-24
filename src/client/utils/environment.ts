/**
 * @file Environment detection utilities
 * @module expo-passkey/utils/environment
 */

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
