/**
 * @file Authenticate passkey endpoint
 * @description Implementation of the passkey authentication endpoint
 */

import { createAuthEndpoint } from "better-auth/api";
import { setCookieCache, setSessionCookie } from "better-auth/cookies";
import type { User } from "better-auth/types";
import { APIError } from "better-call";

import { ERROR_CODES, ERROR_MESSAGES } from "../../types/errors";
import type { Logger } from "../utils/logger";
import { authenticatePasskeySchema } from "../utils/schema";

import type { MobilePasskey } from "~/types";

/**
 * Create passkey authentication endpoint
 */
export const createAuthenticateEndpoint = (options: { logger: Logger }) => {
  const { logger } = options;

  return createAuthEndpoint(
    "/expo-passkey/authenticate",
    {
      method: "POST",
      body: authenticatePasskeySchema,
      metadata: {
        openapi: {
          description: "Authenticate using a registered passkey",
          tags: ["Authentication"],
          responses: {
            200: {
              description: "Authentication successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          token: { type: "string" },
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              email: { type: "string" },
                              emailVerified: { type: "boolean" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication failed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "object",
                        properties: {
                          code: { type: "string" },
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (ctx) => {
      const { deviceId, metadata } = ctx.body;

      try {
        logger.debug("Authentication attempt:", { deviceId });

        // Find the active credential for the provided device ID
        const credential = await ctx.context.adapter.findOne<MobilePasskey>({
          model: "mobilePasskey",
          where: [
            { field: "deviceId", operator: "eq", value: deviceId },
            { field: "status", operator: "eq", value: "active" },
          ],
        });

        if (!credential) {
          logger.warn("Authentication failed: Invalid credential", {
            deviceId,
          });
          throw new APIError("UNAUTHORIZED", {
            code: ERROR_CODES.SERVER.INVALID_CREDENTIAL,
            message: ERROR_MESSAGES[ERROR_CODES.SERVER.INVALID_CREDENTIAL],
          });
        }

        // Find the user associated with the credential
        const user = await ctx.context.adapter.findOne<User>({
          model: "user",
          where: [{ field: "id", operator: "eq", value: credential.userId }],
        });

        if (!user) {
          logger.error("Authentication failed: User not found", {
            deviceId,
            userId: credential.userId,
          });
          throw new APIError("UNAUTHORIZED", {
            code: ERROR_CODES.SERVER.USER_NOT_FOUND,
            message: ERROR_MESSAGES[ERROR_CODES.SERVER.USER_NOT_FOUND],
          });
        }

        const now = new Date().toISOString();

        // Update passkey metadata
        await ctx.context.adapter.update({
          model: "mobilePasskey",
          where: [{ field: "id", operator: "eq", value: credential.id }],
          update: {
            lastUsed: now,
            updatedAt: now,
            metadata: JSON.stringify({
              ...JSON.parse(credential.metadata || "{}"),
              ...metadata,
              lastAuthenticationAt: now,
            }),
          },
        });

        // Create session using internal adapter
        const sessionToken = await ctx.context.internalAdapter.createSession(
          user.id,
          ctx.request,
        );

        const sessionData = await ctx.context.internalAdapter.findSession(
          sessionToken.token,
        );

        if (!sessionData) {
          logger.error("Failed to find created session:", {
            token: sessionToken.token,
            userId: user.id,
          });
          throw new APIError("INTERNAL_SERVER_ERROR", {
            code: "SESSION_NOT_FOUND",
            message: "Failed to create session",
          });
        }

        // Set the session cookie with complete data
        await setSessionCookie(ctx, sessionData);

        // Set session data cache if enabled
        if (ctx.context.options.session?.cookieCache?.enabled) {
          await setCookieCache(ctx, sessionData);
        }

        logger.info("Authentication successful", {
          userId: user.id,
          deviceId,
        });

        // Return response with proper session data
        return ctx.json({
          token: sessionToken.token,
          user: sessionData.user,
        });
      } catch (error) {
        logger.error("Authentication error:", error);
        if (error instanceof APIError) throw error;
        throw new APIError("UNAUTHORIZED", {
          code: ERROR_CODES.SERVER.AUTHENTICATION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SERVER.AUTHENTICATION_FAILED],
        });
      }
    },
  );
};
