jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '16.0',
    select: jest.fn((obj) => obj.ios),
  },
}));

jest.mock('expo', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('expo-application', () => ({
  __esModule: true,
  getIosIdForVendorAsync: jest.fn(() => Promise.resolve('ios-vendor-id-123')),
  getAndroidId: jest.fn(() => 'android-id-123'),
  nativeApplicationVersion: '1.0.0',
}));

jest.mock('expo-device', () => ({
  __esModule: true,
  modelName: 'iPhone 14',
  manufacturer: 'Apple',
  brand: 'Apple',
  osVersion: '16.0',
  platformApiLevel: undefined,
  osBuildId: '16A5288q',
}));

jest.mock('expo-local-authentication', () => ({
  __esModule: true,
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  __esModule: true,
  getRandomBytesAsync: jest.fn(),
}));

// Set up default mock implementations for common needs
beforeEach(() => {
  const {
    hasHardwareAsync,
    isEnrolledAsync,
    supportedAuthenticationTypesAsync,
    authenticateAsync,
  } = require('expo-local-authentication');
  const { getRandomBytesAsync } = require('expo-crypto');

  // Default to successful biometric authentication
  hasHardwareAsync.mockResolvedValue(true);
  isEnrolledAsync.mockResolvedValue(true);
  supportedAuthenticationTypesAsync.mockResolvedValue([2]); // Face ID by default
  authenticateAsync.mockResolvedValue({ success: true });

  // Default random bytes for ID generation
  const randomBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  getRandomBytesAsync.mockResolvedValue(randomBytes);
});

// Silence console errors in tests that intentionally test error paths
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Clean up mocks after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
