/**
 * @file Main entry point for expo-passkey
 * @module expo-passkey
 */

export { ERROR_CODES, PasskeyError } from "./types/errors";
export { expoPasskey } from "./server";

// Re-export all types
export type * from "./types";

export { expoPasskeyClient } from "./client";

import { ERROR_CODES as ServerErrorCodes } from "./server";
export const SERVER_ERROR_CODES = ServerErrorCodes;
