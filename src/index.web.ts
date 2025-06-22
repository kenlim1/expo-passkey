/**
 * @file Web/browser entry point for Expo Passkey client
 * @module expo-passkey/client/index.web
 */

// Export the web-only implementation
export { expoPasskeyClient } from "./client/index.web";

// Re-export types that are relevant for web
export type {
  PasskeyMetadata,
  WebAuthnSupportInfo,
  PasskeyState,
  AuthOptions,
} from "./types/passkey";

export type {
  ExpoPasskeyClientOptions,
  ChallengeResponse,
  RegisterPasskeySuccessResponse,
  AuthPasskeySuccessResponse,
  ListPasskeysSuccessResponse,
  ChallengeResult,
  RegisterPasskeyResult,
  AuthenticatePasskeyResult,
  ListPasskeysResult,
  RevokePasskeyResult,
  PasskeyRegistrationCheckResult,
} from "./types/client";

export { ERROR_CODES, PasskeyError } from "./types/errors";

// Web-specific re-exports
export type {
  AuthenticatorAttachment,
  UserVerificationRequirement,
  PublicKeyCredentialDescriptor,
  AttestationConveyancePreference,
} from "./types/webauthn";

// Web utility re-exports
export {
  isWebAuthnSupportedInBrowser,
  isPlatformAuthenticatorAvailable,
  WEB_ERROR_MESSAGES,
} from "./client/utils/web";
