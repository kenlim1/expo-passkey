/**
 * @file Server core implementation
 * @description Core implementation of the Expo Passkey server plugin
 */

import { createAuthEndpoint } from "better-auth/api";
import type { AuthContext, BetterAuthPlugin } from "better-auth/types";
import { APIError } from "better-call";

import { ERROR_CODES, ERROR_MESSAGES } from "../types/errors";
import type { ExpoPasskeyOptions } from "../types/server";

import {
  createAuthenticateEndpoint,
  createListEndpoint,
  createRegisterEndpoint,
  createRevokeEndpoint,
} from "./endpoints";
import { createLogger, createRateLimits, setupCleanupJob } from "./utils";

/**
 * Creates an instance of the Expo Passkey server plugin
 * @param options Configuration options for the plugin
 * @returns BetterAuthPlugin instance
 */
export const expoPasskey = (options: ExpoPasskeyOptions): BetterAuthPlugin => {
  // Initialize logger
  const logger = createLogger(options.logger);

  // Validate required options
  if (!options.rpName || !options.rpId) {
    throw new Error("rpName and rpId are required options");
  }

  // Configure endpoints with options
  const registerEndpoint = createRegisterEndpoint({
    rpName: options.rpName,
    rpId: options.rpId,
    logger,
  });

  const authenticateEndpoint = createAuthenticateEndpoint({
    logger,
  });

  const listEndpoint = createListEndpoint({
    logger,
  });

  const revokeEndpoint = createRevokeEndpoint({
    logger,
  });

  // Configure rate limits
  const rateLimits = createRateLimits(options.rateLimit);

  return {
    id: "expo-passkey",

    // Database schema for plugin
    schema: {
      mobilePasskey: {
        modelName: "mobilePasskey",
        fields: {
          userId: {
            type: "string",
            required: true,
            references: {
              model: "user",
              field: "id",
              onDelete: "cascade",
            },
          },
          deviceId: {
            type: "string",
            required: true,
            unique: true,
          },
          platform: {
            type: "string",
            required: true,
          },
          lastUsed: {
            type: "string",
            required: true,
          },
          status: {
            type: "string",
            required: true,
            defaultValue: "active",
          },
          createdAt: {
            type: "string",
            required: true,
          },
          updatedAt: {
            type: "string",
            required: true,
          },
          revokedAt: {
            type: "string",
            required: false,
          },
          revokedReason: {
            type: "string",
            required: false,
          },
          metadata: {
            type: "string",
            required: false,
          },
        },
      },
    },
    // Plugin initialization
    init: (ctx: AuthContext) => {
      // Set up cleanup job for inactive passkeys
      setupCleanupJob(ctx, options.cleanup, logger);
    },

    // Middleware for all expo-passkey endpoints
    middlewares: [
      {
        path: "/expo-passkey/**",
        middleware: createAuthEndpoint(
          "/expo-passkey",
          {
            method: "GET",
          },
          async (ctx) => {
            if (!ctx.headers) {
              logger.warn("Missing headers in request");
              throw new APIError("UNAUTHORIZED", {
                code: ERROR_CODES.SERVER.INVALID_CLIENT,
                message: ERROR_MESSAGES[ERROR_CODES.SERVER.INVALID_CLIENT],
              });
            }

            const origin = ctx.headers.get("origin");
            if (origin && !ctx.context.trustedOrigins.includes(origin)) {
              logger.warn("Invalid origin in request", { origin });
              throw new APIError("UNAUTHORIZED", {
                code: ERROR_CODES.SERVER.INVALID_ORIGIN,
                message: ERROR_MESSAGES[ERROR_CODES.SERVER.INVALID_ORIGIN],
              });
            }
          },
        ),
      },
    ],

    // Endpoint implementations
    endpoints: {
      registerPasskey: registerEndpoint,
      authenticatePasskey: authenticateEndpoint,
      listPasskeys: listEndpoint,
      revokePasskey: revokeEndpoint,
    },

    // Rate limiting configuration
    rateLimit: rateLimits,

    // Error codes exposed for client use
    $ERROR_CODES: ERROR_CODES.SERVER,
  };
};
