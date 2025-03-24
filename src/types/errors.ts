/**
 * @file Error type definitions and constants
 * @module expo-passkey/types/errors
 */

/**
 * Error codes for the Expo Passkey plugin
 */
export const ERROR_CODES = {
  // Client-side error codes
  ENVIRONMENT: {
    NOT_SUPPORTED: 'environment_not_supported',
    MODULE_NOT_FOUND: 'module_not_found',
  },
  BIOMETRIC: {
    NOT_SUPPORTED: 'biometric_not_supported',
    NOT_ENROLLED: 'biometric_not_enrolled',
    AUTHENTICATION_FAILED: 'biometric_authentication_failed',
  },
  DEVICE: {
    ID_GENERATION_FAILED: 'device_id_generation_failed',
  },
  NETWORK: {
    REQUEST_FAILED: 'network_request_failed',
  },

  // Server-side error codes
  SERVER: {
    CREDENTIAL_EXISTS: 'device_already_registered',
    INVALID_CREDENTIAL: 'invalid_credential',
    CREDENTIAL_NOT_FOUND: 'credential_not_found',
    REGISTRATION_FAILED: 'registration_failed',
    AUTHENTICATION_FAILED: 'authentication_failed',
    REVOCATION_FAILED: 'revocation_failed',
    INVALID_ORIGIN: 'invalid_origin',
    INVALID_CLIENT: 'invalid_client',
    PASSKEYS_RETRIEVAL_FAILED: 'passkeys_retrieval_failed',
    USER_NOT_FOUND: 'user_not_found',
  },
} as const;

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.ENVIRONMENT.NOT_SUPPORTED]: 'Environment not supported',
  [ERROR_CODES.ENVIRONMENT.MODULE_NOT_FOUND]: 'Required module not found',
  [ERROR_CODES.BIOMETRIC.NOT_SUPPORTED]: 'Biometric authentication not supported on this device',
  [ERROR_CODES.BIOMETRIC.NOT_ENROLLED]: 'Biometric authentication not enrolled on this device',
  [ERROR_CODES.BIOMETRIC.AUTHENTICATION_FAILED]: 'Biometric authentication failed',
  [ERROR_CODES.DEVICE.ID_GENERATION_FAILED]: 'Failed to generate device ID',
  [ERROR_CODES.NETWORK.REQUEST_FAILED]: 'Network request failed',

  [ERROR_CODES.SERVER.CREDENTIAL_EXISTS]: 'Device already registered',
  [ERROR_CODES.SERVER.INVALID_CREDENTIAL]: 'Invalid credential',
  [ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND]: 'Credential not found',
  [ERROR_CODES.SERVER.REGISTRATION_FAILED]: 'Failed to register device',
  [ERROR_CODES.SERVER.AUTHENTICATION_FAILED]: 'Authentication failed',
  [ERROR_CODES.SERVER.REVOCATION_FAILED]: 'Failed to revoke credential',
  [ERROR_CODES.SERVER.INVALID_ORIGIN]: 'Invalid origin',
  [ERROR_CODES.SERVER.INVALID_CLIENT]: 'Invalid client',
  [ERROR_CODES.SERVER.PASSKEYS_RETRIEVAL_FAILED]: 'Failed to retrieve passkeys',
  [ERROR_CODES.SERVER.USER_NOT_FOUND]: 'User not found',
} as const;

/**
 * Custom error class for passkey errors
 */
export class PasskeyError extends Error {
  code: string;

  constructor(code: string, message?: string) {
    super(message || ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || 'Unknown error');
    this.name = 'PasskeyError';
    this.code = code;
  }
}
