/**
 * @file Revoke passkey endpoint
 * @description Implementation of the endpoint to revoke a passkey
 */

import { createAuthEndpoint } from "better-auth/api";
import { APIError } from "better-call";

import { ERROR_CODES, ERROR_MESSAGES } from "../../types/errors";
import type { Logger } from "../utils/logger";
import { revokePasskeySchema } from "../utils/schema";

import type { MobilePasskey } from "~/types";

/**
 * Create endpoint to revoke a passkey
 */
export const createRevokeEndpoint = (options: { logger: Logger }) => {
  const { logger } = options;

  return createAuthEndpoint(
    "/expo-passkey/revoke",
    {
      method: "POST",
      body: revokePasskeySchema,
      metadata: {
        openapi: {
          description: "Revoke a registered passkey",
          tags: ["Authentication"],
          responses: {
            200: {
              description: "Passkey successfully revoked",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                    },
                  },
                },
              },
            },
            404: {
              description: "Passkey not found",
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
      const { userId, deviceId, reason } = ctx.body;

      try {
        logger.debug("Revoking passkey", { userId, deviceId });

        // Find the active credential for the provided device ID and user ID
        const credential = await ctx.context.adapter.findOne<MobilePasskey>({
          model: "mobilePasskey",
          where: [
            { field: "deviceId", operator: "eq", value: deviceId },
            { field: "userId", operator: "eq", value: userId },
            { field: "status", operator: "eq", value: "active" },
          ],
        });

        if (!credential) {
          logger.warn("Revoke failed: Passkey not found", { deviceId });
          throw new APIError("NOT_FOUND", {
            code: ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND,
            message: ERROR_MESSAGES[ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND],
          });
        }

        const now = new Date();
        const nowISOString = now.toISOString();

        // Update the credential to revoked status
        await ctx.context.adapter.update({
          model: "mobilePasskey",
          where: [{ field: "id", operator: "eq", value: credential.id }],
          update: {
            status: "revoked",
            revokedAt: nowISOString,
            revokedReason: reason || "user_initiated",
            updatedAt: now,
          },
        });

        logger.info("Passkey revoked successfully", {
          userId,
          deviceId,
          reason: reason || "user_initiated",
        });

        return ctx.json({ success: true });
      } catch (error) {
        logger.error("Failed to revoke passkey", error);
        if (error instanceof APIError) throw error;
        throw new APIError("BAD_REQUEST", {
          code: ERROR_CODES.SERVER.REVOCATION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SERVER.REVOCATION_FAILED],
        });
      }
    },
  );
};
