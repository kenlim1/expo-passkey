import { setCookieCache, setSessionCookie } from 'better-auth/cookies';
import { APIError } from 'better-call';

import { createAuthenticateEndpoint } from '../../../server/endpoints/authenticate';

// Mock dependencies
jest.mock('better-auth/cookies', () => ({
  setSessionCookie: jest.fn(),
  setCookieCache: jest.fn(),
}));

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

type EndpointHandler = (ctx: any) => Promise<any>;

describe('authenticatePasskey endpoint', () => {
  // Setup options for the endpoint
  const options = {
    logger: mockLogger,
  };

  // Mock request context
  const mockCtx = {
    body: {
      deviceId: 'device-123',
      metadata: {
        lastLocation: 'mobile-app',
        appVersion: '1.0.0',
      },
    },
    request: {},
    context: {
      adapter: {
        findOne: jest.fn(),
        update: jest.fn(),
      },
      internalAdapter: {
        createSession: jest.fn(),
        findSession: jest.fn(),
      },
      options: {
        session: {
          cookieCache: {
            enabled: true,
          },
        },
      },
    },
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate successfully with a valid passkey', async () => {
    // Mock credentials and user
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        status: 'active',
        metadata: '{"deviceName":"Test Device"}',
        lastUsed: '2023-01-01T00:00:00Z',
      }) // Credential exists
      .mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
      }); // User exists

    // Mock session creation
    mockCtx.context.internalAdapter.createSession.mockResolvedValueOnce({
      token: 'session-token-123',
    });

    // Mock session retrieval
    mockCtx.context.internalAdapter.findSession.mockResolvedValueOnce({
      token: 'session-token-123',
      user: { id: 'user-123', email: 'user@example.com' },
    });

    // Create endpoint and get handler using type assertion
    const endpoint = createAuthenticateEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call the handler
    await handler(mockCtx as any);

    // Verify credential was found
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledWith({
      model: 'mobilePasskey',
      where: [
        { field: 'deviceId', operator: 'eq', value: 'device-123' },
        { field: 'status', operator: 'eq', value: 'active' },
      ],
    });

    // Verify user was found
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledWith({
      model: 'user',
      where: [{ field: 'id', operator: 'eq', value: 'user-123' }],
    });

    // Verify metadata update
    expect(mockCtx.context.adapter.update).toHaveBeenCalledWith({
      model: 'mobilePasskey',
      where: [{ field: 'id', operator: 'eq', value: 'passkey-123' }],
      update: expect.objectContaining({
        lastUsed: expect.any(String),
        metadata: expect.stringContaining('lastAuthenticationAt'),
      }),
    });

    // Verify session creation
    expect(mockCtx.context.internalAdapter.createSession).toHaveBeenCalledWith(
      'user-123',
      mockCtx.request
    );

    // Verify session cookies were set
    expect(setSessionCookie).toHaveBeenCalled();
    expect(setCookieCache).toHaveBeenCalled();

    // Verify response
    expect(mockCtx.json).toHaveBeenCalledWith({
      token: 'session-token-123',
      user: { id: 'user-123', email: 'user@example.com' },
    });

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith('Authentication successful', expect.any(Object));
  });

  it('should reject authentication with an invalid passkey', async () => {
    // Mock credential not found
    mockCtx.context.adapter.findOne.mockResolvedValueOnce(null);

    // Create endpoint and get handler using type assertion
    const endpoint = createAuthenticateEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call handler and expect it to throw
    await expect(handler(mockCtx as any)).rejects.toThrow(APIError);

    // Verify credential lookup was attempted
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledWith({
      model: 'mobilePasskey',
      where: [
        { field: 'deviceId', operator: 'eq', value: 'device-123' },
        { field: 'status', operator: 'eq', value: 'active' },
      ],
    });

    // Verify no user lookup or session creation
    expect(mockCtx.context.adapter.update).not.toHaveBeenCalled();
    expect(mockCtx.context.internalAdapter.createSession).not.toHaveBeenCalled();

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Authentication failed: Invalid credential',
      expect.any(Object)
    );
  });

  it('should reject if user does not exist', async () => {
    // Mock credential exists but user doesn't
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        status: 'active',
        metadata: '{"deviceName":"Test Device"}',
      }) // Credential exists
      .mockResolvedValueOnce(null); // User doesn't exist

    // Create endpoint and get handler using type assertion
    const endpoint = createAuthenticateEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call handler and expect it to throw
    await expect(handler(mockCtx as any)).rejects.toThrow(APIError);

    // Verify credential and user lookups were attempted
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledTimes(2);

    // Verify no update or session creation
    expect(mockCtx.context.adapter.update).not.toHaveBeenCalled();
    expect(mockCtx.context.internalAdapter.createSession).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Authentication failed: User not found',
      expect.any(Object)
    );
  });

  it('should handle session creation failure', async () => {
    // Mock credentials and user
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({
        id: 'passkey-123',
        userId: 'user-123',
        deviceId: 'device-123',
        platform: 'ios',
        status: 'active',
        metadata: '{"deviceName":"Test Device"}',
      }) // Credential exists
      .mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
      }); // User exists

    // Mock session creation success
    mockCtx.context.internalAdapter.createSession.mockResolvedValueOnce({
      token: 'session-token-123',
    });

    // But mock session retrieval failure
    mockCtx.context.internalAdapter.findSession.mockResolvedValueOnce(null);

    // Create endpoint and get handler using type assertion
    const endpoint = createAuthenticateEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call handler and expect it to throw
    await expect(handler(mockCtx as any)).rejects.toThrow(APIError);

    // Verify update was performed
    expect(mockCtx.context.adapter.update).toHaveBeenCalled();

    // Verify session creation was attempted
    expect(mockCtx.context.internalAdapter.createSession).toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to find created session:',
      expect.any(Object)
    );
  });

  it('should handle unexpected errors gracefully', async () => {
    // Mock database error
    mockCtx.context.adapter.findOne.mockRejectedValueOnce(new Error('Database connection error'));

    // Create endpoint and get handler using type assertion
    const endpoint = createAuthenticateEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call handler and expect it to throw
    await expect(handler(mockCtx as any)).rejects.toThrow(APIError);

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
  });
});
