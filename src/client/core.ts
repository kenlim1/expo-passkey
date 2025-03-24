/**
 * @file Core implementation of the Expo Passkey client
 * @module expo-passkey/client/core
 */

import type {
  BetterFetchOption,
  BetterFetchPlugin,
  ErrorContext,
} from "@better-fetch/fetch";
import type { BetterAuthClientPlugin } from "better-auth/client";

import type {
  AuthPasskeySuccessResponse,
  AuthenticatePasskeyResult,
  ExpoPasskeyClientOptions,
  ExpoPasskeyServerPlugin,
  ListPasskeysResult,
  ListPasskeysSuccessResponse,
  PasskeyMetadata,
  PasskeyRegistrationCheckResult,
  RegisterPasskeyResult,
  RegisterPasskeySuccessResponse,
  RevokePasskeyResult,
} from "../types";

import { authenticateWithBiometrics } from "./utils/biometrics";
import { clearDeviceId, getDeviceInfo } from "./utils/device";
import { loadExpoModules } from "./utils/modules";

import { ERROR_CODES, PasskeyError } from "~/types/errors";

/**
 * Client implementation of the Expo Passkey plugin
 */
class ExpoPasskeyClient {
  private options: ExpoPasskeyClientOptions;

  constructor(options: ExpoPasskeyClientOptions = {}) {
    // Set defaults for options
    this.options = {
      storagePrefix: options.storagePrefix || "_better-auth",
    };
  }

  /**
   * Makes device info available to plugin actions
   */
  public async getDeviceInformation() {
    return getDeviceInfo(this.options);
  }

  /**
   * Get the client options
   */
  public getOptions() {
    return this.options;
  }
}

/**
 * Creates an instance of the Expo Passkey client plugin
 * @param options Configuration options for the client plugin
 * @returns Better Auth client plugin instance
 */
export const expoPasskeyClient = (options: ExpoPasskeyClientOptions = {}) => {
  // Create client without immediately loading modules
  const client = new ExpoPasskeyClient(options);

  // Helper function to get modules lazily
  const getModules = () => {
    try {
      return loadExpoModules();
    } catch (error) {
      // Rethrow any errors from loadExpoModules
      throw error;
    }
  };

  return {
    id: "expo-passkey",
    $InferServerPlugin: {} as ExpoPasskeyServerPlugin,

    pathMethods: {
      "/expo-passkey/register": "POST",
      "/expo-passkey/authenticate": "POST",
      "/expo-passkey/list/:userId": "GET",
      "/expo-passkey/revoke": "POST",
    },

    getActions: ($fetch) => ({
      /**
       * Registers a new passkey for a device
       */
      registerPasskey: async (
        data: {
          userId: string;
          deviceId?: string;
          metadata?: Partial<PasskeyMetadata>;
        },
        fetchOptions?: BetterFetchOption,
      ): Promise<RegisterPasskeyResult> => {
        try {
          // Get modules only when function is called
          const { Platform } = getModules();

          // Get device information
          const deviceInfo = await client.getDeviceInformation();

          // Check if biometric authentication is supported
          if (!deviceInfo.biometricSupport.isSupported) {
            throw new PasskeyError(
              ERROR_CODES.BIOMETRIC.NOT_SUPPORTED,
              "Biometric authentication not supported on this device",
            );
          }

          // Check if biometric authentication is enrolled
          if (!deviceInfo.biometricSupport.isEnrolled) {
            throw new PasskeyError(
              ERROR_CODES.BIOMETRIC.NOT_ENROLLED,
              Platform.OS === "ios"
                ? "Please set up Face ID or Touch ID in your iOS Settings"
                : "Please set up biometric authentication in your device settings",
            );
          }

          // Authenticate with biometrics
          await authenticateWithBiometrics({
            promptMessage:
              Platform.OS === "ios"
                ? "Verify to register passkey"
                : "Verify to register biometric authentication",
            cancelLabel: "Cancel",
            disableDeviceFallback: true,
            fallbackLabel: "",
          });

          // Make API request to register passkey
          const response = await $fetch<RegisterPasskeySuccessResponse>(
            "/expo-passkey/register",
            {
              method: "POST",
              body: {
                userId: data.userId,
                deviceId: data.deviceId || deviceInfo.deviceId,
                platform: deviceInfo.platform,
                metadata: {
                  deviceName: deviceInfo.model,
                  deviceModel: deviceInfo.model,
                  appVersion: deviceInfo.appVersion,
                  manufacturer: deviceInfo.manufacturer,
                  biometricType: deviceInfo.biometricSupport.authenticationType,
                  ...data.metadata,
                },
              },
              ...fetchOptions,
            },
          );

          // Check if response was successful
          if (response.data) {
            return { data: response.data, error: null };
          }

          // If there was an error in the response
          throw new Error(
            response.error?.message || "Failed to register passkey",
          );
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      },

      /**
       * Authenticates a user using a registered passkey
       */
      authenticateWithPasskey: async (
        data?: {
          deviceId?: string;
          metadata?: Partial<PasskeyMetadata>;
        },
        fetchOptions?: BetterFetchOption,
      ): Promise<AuthenticatePasskeyResult> => {
        try {
          // Get modules only when function is called
          const { Platform } = getModules();

          const deviceInfo = await client.getDeviceInformation();

          // Check biometric support
          if (
            !deviceInfo.biometricSupport.isSupported ||
            !deviceInfo.biometricSupport.isEnrolled
          ) {
            throw new PasskeyError(
              ERROR_CODES.BIOMETRIC.NOT_SUPPORTED,
              "Biometric authentication not available",
            );
          }

          // Authenticate with biometrics
          await authenticateWithBiometrics({
            promptMessage:
              Platform.OS === "ios"
                ? "Sign in with passkey"
                : "Sign in with biometric authentication",
            cancelLabel: "Cancel",
            disableDeviceFallback: true,
            fallbackLabel: "",
          });

          // Make authentication request
          const response = await $fetch<AuthPasskeySuccessResponse>(
            "/expo-passkey/authenticate",
            {
              method: "POST",
              body: {
                deviceId: data?.deviceId || deviceInfo.deviceId,
                metadata: {
                  lastLocation: "mobile-app",
                  appVersion: deviceInfo.appVersion,
                  deviceModel: deviceInfo.model,
                  manufacturer: deviceInfo.manufacturer,
                  biometricType: deviceInfo.biometricSupport.authenticationType,
                  ...data?.metadata,
                },
              },
              credentials: "include",
              ...fetchOptions,
            },
          );

          // Check if response was successful
          if (
            response &&
            response.data &&
            typeof response.data === "object" &&
            "token" in response.data &&
            "user" in response.data
          ) {
            return {
              data: response.data,
              error: null,
            };
          }

          // If there was an error in the response
          return {
            data: null,
            error: new Error(
              response?.error?.message ||
                "Authentication failed: Invalid or unexpected response format",
            ),
          };
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      },

      /**
       * Lists passkeys for a user
       */
      listPasskeys: async (
        data: {
          userId: string;
          limit?: number;
          offset?: number;
        },
        fetchOptions?: BetterFetchOption,
      ): Promise<ListPasskeysResult> => {
        try {
          if (!data.userId) {
            throw new PasskeyError(
              ERROR_CODES.SERVER.USER_NOT_FOUND,
              "userId is required",
            );
          }

          // Make request to list passkeys
          const response = await $fetch<ListPasskeysSuccessResponse>(
            `/expo-passkey/list/${data.userId}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json",
                ...fetchOptions?.headers,
              },
              query: {
                limit: data.limit?.toString(),
                offset: data.offset?.toString(),
              },
              ...fetchOptions,
            },
          );

          // Check if response was successful
          if (response.data) {
            return {
              data: response.data,
              error: null,
            };
          }

          // If there was an error in the response
          throw new Error(
            response.error?.message || "Failed to retrieve passkeys",
          );
        } catch (error) {
          return {
            data: { passkeys: [], nextOffset: undefined },
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      },

      /**
       * Revokes a passkey
       */
      revokePasskey: async (
        data: {
          userId: string;
          deviceId?: string;
          reason?: string;
        },
        fetchOptions?: BetterFetchOption,
      ): Promise<RevokePasskeyResult> => {
        try {
          const deviceInfo = await client.getDeviceInformation();
          const clientOptions = client.getOptions();

          // Make request to revoke passkey
          const response = await $fetch<{ success: boolean }>(
            "/expo-passkey/revoke",
            {
              method: "POST",
              body: {
                userId: data.userId,
                deviceId: data.deviceId || deviceInfo.deviceId,
                reason: data.reason,
              },
              ...fetchOptions,
            },
          );

          // Clear device ID from storage
          await clearDeviceId(clientOptions);

          // Check if response was successful
          if (response.data) {
            return { data: response.data, error: null };
          }

          // If there was an error in the response
          throw new Error(
            response.error?.message || "Failed to revoke passkey",
          );
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      },

      /**
       * Checks if a device is registered for a user
       */
      checkPasskeyRegistration: async (
        userId: string,
        fetchOptions?: BetterFetchOption,
      ): Promise<PasskeyRegistrationCheckResult> => {
        try {
          const deviceInfo = await client.getDeviceInformation();

          const response = await $fetch<{
            passkeys: Array<{ deviceId: string; status: string }>;
          }>("/expo-passkey/list", {
            method: "GET",
            body: {
              userId,
              limit: 1,
            },
            ...fetchOptions,
          });

          // Check if response was successful
          const passkeys = response.data?.passkeys || [];

          const isRegistered = Array.isArray(passkeys)
            ? passkeys.some(
                (p) =>
                  p.deviceId === deviceInfo.deviceId && p.status === "active",
              )
            : false;

          return {
            isRegistered,
            deviceId: deviceInfo.deviceId,
            biometricSupport: deviceInfo.biometricSupport,
            error: null,
          };
        } catch (error) {
          return {
            isRegistered: false,
            deviceId: null,
            biometricSupport: null,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      },

      /**
       * Checks if passkeys are supported on this device
       */
      isPasskeySupported: async () => {
        try {
          // Get modules only when function is called
          const { Platform } = getModules();

          const deviceInfo = await client.getDeviceInformation();
          const { biometricSupport } = deviceInfo;

          if (!biometricSupport.isSupported || !biometricSupport.isEnrolled) {
            return false;
          }

          if (Platform.OS === "ios") {
            const version = parseInt(Platform.Version as string, 10);
            return version >= 16;
          }

          if (Platform.OS === "android") {
            const apiLevel = biometricSupport.platformDetails.apiLevel;
            // Return false if apiLevel is undefined, null, or less than 29
            if (!apiLevel || typeof apiLevel !== "number" || apiLevel < 29) {
              return false;
            }
            return true; // Android 10 (API 29) or higher
          }

          return false;
        } catch (error) {
          console.error("Error checking passkey support:", error);
          return false;
        }
      },

      /**
       * Gets biometric information for the device
       */
      getBiometricInfo: async () => {
        return client.getDeviceInformation();
      },

      /**
       * Gets the storage keys used by the plugin
       */
      getStorageKeys: () => {
        const prefix = client.getOptions().storagePrefix;
        return {
          DEVICE_ID: `${prefix}.device_id`,
          STATE: `${prefix}.passkey_state`,
          USER_ID: `${prefix}.user_id`,
        };
      },
    }),

    fetchPlugins: [
      {
        id: "expo-passkey-plugin",
        name: "Expo Passkey Plugin",
        description: "Handles passkey authentication and error handling",
        version: "1.0.0",
        hooks: {
          onError: async (context: ErrorContext) => {
            // Check if the error is authentication related
            if (context.response?.status === 401) {
              await clearDeviceId(client.getOptions());
            }
          },
        },
        init: async (url: string, options?: BetterFetchOption) => {
          try {
            // Get modules only when plugin is initialized
            const { Platform } = getModules();

            // Add custom headers or modify request options
            return {
              url,
              options: {
                ...options,
                headers: {
                  ...options?.headers,
                  "X-Client-Type": "expo-passkey",
                  "X-Client-Version": "1.0.0",
                  "X-Platform": Platform.OS,
                  "X-Platform-Version": Platform.Version.toString(),
                },
              },
            };
          } catch (error) {
            // If there's an error loading modules, just return the URL and options as is
            // without customizing the headers
            console.warn("Could not add custom platform headers:", error);
            return { url, options };
          }
        },
      } satisfies BetterFetchPlugin,
    ],
  } satisfies BetterAuthClientPlugin;
};
