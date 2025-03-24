/**
 * @file Register passkey endpoint
 * @description Implementation of the passkey registration endpoint
 */

import { createAuthEndpoint } from 'better-auth/api';
import { APIError } from 'better-call';

import { ERROR_CODES, ERROR_MESSAGES } from '../../types/errors';
import type { Logger } from '../utils/logger';
import { registerPasskeySchema } from '../utils/schema';

import type { MobilePasskey } from '~/types';

/**
 * Create passkey registration endpoint
 */
export const createRegisterEndpoint = (options: {
  rpName: string;
  rpId: string;
  logger: Logger;
}) => {
  const { rpName, rpId, logger } = options;

  return createAuthEndpoint(
    '/expo-passkey/register',
    {
      method: 'POST',
      body: registerPasskeySchema,
      metadata: {
        openapi: {
          description: 'Register a new passkey for a device',
          tags: ['Authentication'],
          responses: {
            200: {
              description: 'Passkey successfully registered',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      rpName: { type: 'string' },
                      rpId: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string' },
                          message: { type: 'string' },
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
      const { userId, deviceId, platform, metadata } = ctx.body;

      try {
        logger.debug('Registration attempt:', {
          userId,
          deviceId,
          platform,
        });

        // Verify user exists
        const user = await ctx.context.adapter.findOne({
          model: 'user',
          where: [{ field: 'id', operator: 'eq', value: userId }],
        });

        if (!user) {
          logger.warn('Registration failed: User not found', { userId });
          throw new APIError('BAD_REQUEST', {
            code: ERROR_CODES.SERVER.USER_NOT_FOUND,
            message: ERROR_MESSAGES[ERROR_CODES.SERVER.USER_NOT_FOUND],
          });
        }

        // Check for existing credential (regardless of status)
        const existingCredential = await ctx.context.adapter.findOne<MobilePasskey>({
          model: 'mobilePasskey',
          where: [{ field: 'deviceId', operator: 'eq', value: deviceId }],
        });

        const now = new Date().toISOString();

        if (existingCredential) {
          // If the existing credential is already active, throw error
          if (existingCredential.status === 'active') {
            logger.warn('Registration failed: Device already registered', {
              deviceId,
            });
            throw new APIError('BAD_REQUEST', {
              code: ERROR_CODES.SERVER.CREDENTIAL_EXISTS,
              message: ERROR_MESSAGES[ERROR_CODES.SERVER.CREDENTIAL_EXISTS],
            });
          }

          // Update the existing revoked credential
          logger.info('Reactivating previously revoked passkey', {
            deviceId,
            previousStatus: existingCredential.status,
          });

          await ctx.context.adapter.update({
            model: 'mobilePasskey',
            where: [{ field: 'id', operator: 'eq', value: existingCredential.id }],
            update: {
              userId,
              platform,
              lastUsed: now,
              status: 'active',
              updatedAt: now,
              revokedAt: null,
              revokedReason: null,
              metadata: metadata ? JSON.stringify(metadata) : '{}',
            },
          });
        } else {
          // Create new passkey record if one doesn't exist
          await ctx.context.adapter.create({
            model: 'mobilePasskey',
            data: {
              id: ctx.context.generateId({
                model: 'mobilePasskey',
                size: 32,
              }),
              userId,
              deviceId,
              platform,
              lastUsed: now,
              status: 'active',
              createdAt: now,
              updatedAt: now,
              metadata: metadata ? JSON.stringify(metadata) : '{}',
            },
          });
        }

        logger.info('Passkey registration successful', {
          userId,
          deviceId,
          platform,
          isUpdate: !!existingCredential,
        });

        return ctx.json({
          success: true,
          rpName,
          rpId,
        });
      } catch (error) {
        logger.error('Registration error:', error);
        if (error instanceof APIError) throw error;
        throw new APIError('BAD_REQUEST', {
          code: ERROR_CODES.SERVER.REGISTRATION_FAILED,
          message: ERROR_MESSAGES[ERROR_CODES.SERVER.REGISTRATION_FAILED],
        });
      }
    }
  );
};
