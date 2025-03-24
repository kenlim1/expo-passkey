import { ERROR_CODES, ERROR_MESSAGES, PasskeyError } from '../../../types/errors';

describe('Error types', () => {
  describe('ERROR_CODES', () => {
    it('should contain all necessary error codes', () => {
      // Check environment error codes
      expect(ERROR_CODES.ENVIRONMENT.NOT_SUPPORTED).toBeDefined();
      expect(ERROR_CODES.ENVIRONMENT.MODULE_NOT_FOUND).toBeDefined();

      // Check biometric error codes
      expect(ERROR_CODES.BIOMETRIC.NOT_SUPPORTED).toBeDefined();
      expect(ERROR_CODES.BIOMETRIC.NOT_ENROLLED).toBeDefined();
      expect(ERROR_CODES.BIOMETRIC.AUTHENTICATION_FAILED).toBeDefined();

      // Check device error codes
      expect(ERROR_CODES.DEVICE.ID_GENERATION_FAILED).toBeDefined();

      // Check network error codes
      expect(ERROR_CODES.NETWORK.REQUEST_FAILED).toBeDefined();

      // Check server error codes
      expect(ERROR_CODES.SERVER.CREDENTIAL_EXISTS).toBeDefined();
      expect(ERROR_CODES.SERVER.INVALID_CREDENTIAL).toBeDefined();
      expect(ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND).toBeDefined();
      expect(ERROR_CODES.SERVER.REGISTRATION_FAILED).toBeDefined();
      expect(ERROR_CODES.SERVER.AUTHENTICATION_FAILED).toBeDefined();
      expect(ERROR_CODES.SERVER.REVOCATION_FAILED).toBeDefined();
      expect(ERROR_CODES.SERVER.INVALID_ORIGIN).toBeDefined();
      expect(ERROR_CODES.SERVER.INVALID_CLIENT).toBeDefined();
      expect(ERROR_CODES.SERVER.PASSKEYS_RETRIEVAL_FAILED).toBeDefined();
      expect(ERROR_CODES.SERVER.USER_NOT_FOUND).toBeDefined();
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have a corresponding message for each error code', () => {
      // Check that we have messages for all error codes
      const allErrorCodes = [
        ...Object.values(ERROR_CODES.ENVIRONMENT),
        ...Object.values(ERROR_CODES.BIOMETRIC),
        ...Object.values(ERROR_CODES.DEVICE),
        ...Object.values(ERROR_CODES.NETWORK),
        ...Object.values(ERROR_CODES.SERVER),
      ];

      allErrorCodes.forEach((code) => {
        expect(ERROR_MESSAGES[code]).toBeDefined();
        expect(typeof ERROR_MESSAGES[code]).toBe('string');
      });
    });
  });

  describe('PasskeyError', () => {
    it('should create an error with the proper code and message', () => {
      const error = new PasskeyError(ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PasskeyError');
      expect(error.code).toBe(ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND);
      expect(error.message).toBe(ERROR_MESSAGES[ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND]);
    });

    it('should allow custom message override', () => {
      const customMessage = 'Custom error message';
      const error = new PasskeyError(ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND, customMessage);

      expect(error.code).toBe(ERROR_CODES.SERVER.CREDENTIAL_NOT_FOUND);
      expect(error.message).toBe(customMessage);
    });

    it('should handle unknown error codes gracefully', () => {
      const unknownCode = 'unknown_code';
      const error = new PasskeyError(unknownCode as any);

      expect(error.code).toBe(unknownCode);
      expect(error.message).toBe('Unknown error');
    });
  });
});
