/**
 * @file Module loader for Expo dependencies
 * @module expo-passkey/client/utils/modules
 */

// Interface for the loaded modules
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
 * @throws Error if running in a server environment
 */
export function loadExpoModules(): ExpoModules {
  // Check if running in a server environment
  if (typeof window === "undefined" && typeof process !== "undefined") {
    throw new Error("Expo modules cannot be loaded in a server environment");
  }

  return {
    Platform: require("react-native").Platform,
    Application: require("expo-application"),
    Device: require("expo-device"),
    LocalAuthentication: require("expo-local-authentication"),
    SecureStore: require("expo-secure-store"),
    Crypto: require("expo-crypto"),
  };
}
