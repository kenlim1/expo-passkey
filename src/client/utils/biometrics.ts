/**
 * @file Biometric authentication utilities
 * @module expo-passkey/client/utils/biometrics
 */

import type { AuthOptions, BiometricSupportInfo } from "../../types";
import { ERROR_CODES, PasskeyError } from "../../types/errors";
import { isSupportedPlatform } from "./environment";

import { loadExpoModules } from "./modules";

// Helper function to get modules only when needed
function getModules() {
  return loadExpoModules();
}

/**
 * Checks if biometric authentication is supported and available
 * @returns Promise resolving to biometric support information
 */
export async function checkBiometricSupport(): Promise<BiometricSupportInfo> {
  try {
    const { LocalAuthentication, Platform, Device } = getModules();

    const isSupported = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const availableTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    const platformDetails = {
      platform: Platform.OS,
      version: Platform.Version,
      apiLevel: Platform.OS === "android" ? Device.platformApiLevel : undefined,
      manufacturer: Platform.OS === "android" ? Device.manufacturer : undefined,
      brand: Platform.OS === "android" ? Device.brand : undefined,
    };

    // Platform-specific validation
    if (Platform.OS === "ios") {
      const version = parseInt(Platform.Version as string, 10);
      if (version < 16) {
        return {
          isSupported: false,
          isEnrolled: false,
          availableTypes: [],
          authenticationType: "None",
          error: "iOS 16 or higher required for passkey support",
          platformDetails,
        };
      }
    } else if (Platform.OS === "android") {
      if (!platformDetails.apiLevel || platformDetails.apiLevel < 23) {
        return {
          isSupported: false,
          isEnrolled: false,
          availableTypes: [],
          authenticationType: "None",
          error:
            "Android 6.0 (API 23) or higher required for biometric support",
          platformDetails,
        };
      }
    } else {
      return {
        isSupported: false,
        isEnrolled: false,
        availableTypes: [],
        authenticationType: "None",
        error: "Unsupported platform",
        platformDetails: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      };
    }

    const authenticationType = getBiometricType(availableTypes);

    return {
      isSupported,
      isEnrolled,
      availableTypes,
      authenticationType,
      error: null,
      platformDetails,
    };
  } catch (error) {
    const { Platform } = getModules();
    return {
      isSupported: false,
      isEnrolled: false,
      availableTypes: [],
      authenticationType: "None",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error checking biometric support",
      platformDetails: {
        platform: Platform.OS,
        version: Platform.Version,
      },
    };
  }
}

/**
 * Determines the type of biometric authentication available
 * @param types Available authentication types
 * @returns Human-readable biometric type
 */
export function getBiometricType(types: number[]): string {
  const { LocalAuthentication, Platform } = getModules();

  if (Platform.OS === "ios") {
    return types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
      ? "Face ID"
      : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? "Touch ID"
        : "None";
  }

  if (Platform.OS === "android") {
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "Fingerprint";
    }
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return "Face Unlock";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return "Iris";
    }
  }

  return "Biometric";
}

/**
 * Authenticates the user with biometrics
 * @param options Authentication options like prompt message
 * @returns Promise resolving to authentication success
 * @throws {PasskeyError} If authentication fails
 */
export async function authenticateWithBiometrics(
  options: AuthOptions,
): Promise<boolean> {
  const { LocalAuthentication } = getModules();

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: options.promptMessage,
    cancelLabel: options.cancelLabel,
    disableDeviceFallback: options.disableDeviceFallback,
    fallbackLabel: options.fallbackLabel,
  });

  if (!result.success) {
    throw new PasskeyError(
      ERROR_CODES.BIOMETRIC.AUTHENTICATION_FAILED,
      result.error || "Authentication failed",
    );
  }

  return result.success;
}

/**
 * Checks if passkeys are supported on the current device
 * @returns Promise resolving to true if passkeys are supported
 */
export async function isPasskeySupported(): Promise<boolean> {
  try {
    const { Platform, Device } = getModules();

    const biometricSupport = await checkBiometricSupport();

    if (!biometricSupport.isSupported || !biometricSupport.isEnrolled) {
      return false;
    }

    if (Platform.OS === "ios") {
      return isSupportedPlatform(Platform.OS, Platform.Version);
    }

    if (Platform.OS === "android") {
      const apiLevel = Device.platformApiLevel;
      if (!apiLevel) return false;
      return isSupportedPlatform(Platform.OS, apiLevel);
    }

    return false;
  } catch (error) {
    console.error("Error checking passkey support:", error);
    return false;
  }
}
