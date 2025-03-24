/**
 * @file Main entry point for expo-passkey
 * @module expo-passkey
 */

export * from './types';

// Re-export client and server
export { expoPasskeyClient } from '~/client';
export { ERROR_CODES as SERVER_ERROR_CODES, expoPasskey } from '~/server';
