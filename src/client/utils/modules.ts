/**
 * @file Module loader for Expo dependencies
 * @module expo-passkey/client/utils/modules
 */

import { ERROR_CODES, PasskeyError } from "../../types/errors";
import { isExpoEnvironment } from "../utils/environment";

/**
 * Interface for the loaded modules
 */
export interface ExpoModules {
  Platform: typeof import("react-native").Platform;
  Application: typeof import("expo-application");
  Device: typeof import("expo-device");
  LocalAuthentication: typeof import("expo-local-authentication");
  SecureStore: typeof import("expo-secure-store");
  Crypto: typeof import("expo-crypto");
}

/**
 * Loads all required Expo modules
 * @returns Object containing all required modules
 * @throws {PasskeyError} If not in an Expo environment or a required module is missing
 */
export function loadExpoModules(): ExpoModules {
  // Check if running in Expo environment
  if (!isExpoEnvironment()) {
    throw new PasskeyError(
      ERROR_CODES.ENVIRONMENT.NOT_SUPPORTED,
      "Expo Passkey is only supported in Expo environments. This package cannot be used in web browsers or other non-Expo environments.",
    );
  }

  try {
    // Load all required modules
    return {
      Platform: require("react-native").Platform,
      Application: require("expo-application"),
      Device: require("expo-device"),
      LocalAuthentication: require("expo-local-authentication"),
      SecureStore: require("expo-secure-store"),
      Crypto: require("expo-crypto"),
    };
  } catch (error) {
    // If a module is missing, throw a clear error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new PasskeyError(
      ERROR_CODES.ENVIRONMENT.MODULE_NOT_FOUND,
      `Failed to load required Expo modules: ${errorMessage}. Make sure all peer dependencies are installed.`,
    );
  }
}
