import { APIError } from "better-call";

import { createRegisterEndpoint } from "../../../server/endpoints/register";

// Mock the logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

type EndpointHandler = (ctx: any) => Promise<any>;

describe("registerPasskey endpoint", () => {
  // Setup options for the endpoint
  const options = {
    rpName: "Test App",
    rpId: "example.com",
    logger: mockLogger,
  };

  // Mock request context
  const mockCtx = {
    body: {
      userId: "user-123",
      deviceId: "device-123",
      platform: "ios",
      metadata: {
        deviceName: "iPhone Test",
      },
    },
    context: {
      adapter: {
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      generateId: jest.fn(() => "generated-id"),
    },
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register a new passkey successfully", async () => {
    // Mock user exists
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({ id: "user-123" }) // User exists
      .mockResolvedValueOnce(null); // No existing credential

    // Create endpoint and get handler using type assertion
    const endpoint = createRegisterEndpoint(options);
    // Use type assertion to bypass TypeScript's type checking
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call the handler
    await handler(mockCtx);

    // Verify user check was performed
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledWith({
      model: "user",
      where: [{ field: "id", operator: "eq", value: "user-123" }],
    });

    // Verify credential check was performed
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledWith({
      model: "mobilePasskey",
      where: [{ field: "deviceId", operator: "eq", value: "device-123" }],
    });

    // Verify new passkey creation
    expect(mockCtx.context.adapter.create).toHaveBeenCalledWith({
      model: "mobilePasskey",
      data: expect.objectContaining({
        id: "generated-id",
        userId: "user-123",
        deviceId: "device-123",
        platform: "ios",
        status: "active",
        metadata: expect.any(String),
      }),
    });

    // Verify response
    expect(mockCtx.json).toHaveBeenCalledWith({
      success: true,
      rpName: "Test App",
      rpId: "example.com",
    });

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Passkey registration successful",
      expect.any(Object),
    );
  });

  it("should reactivate a revoked passkey", async () => {
    // Mock user and existing revoked credential
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({ id: "user-123" }) // User exists
      .mockResolvedValueOnce({
        id: "passkey-123",
        userId: "user-123",
        deviceId: "device-123",
        platform: "ios",
        status: "revoked",
        metadata: "{}",
      }); // Existing revoked credential

    // Create endpoint and get handler using type assertion
    const endpoint = createRegisterEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call the handler
    await handler(mockCtx);

    // Verify update was called instead of create
    expect(mockCtx.context.adapter.update).toHaveBeenCalledWith({
      model: "mobilePasskey",
      where: [{ field: "id", operator: "eq", value: "passkey-123" }],
      update: expect.objectContaining({
        status: "active",
        revokedAt: null,
        revokedReason: null,
      }),
    });

    expect(mockCtx.context.adapter.create).not.toHaveBeenCalled();

    // Verify response
    expect(mockCtx.json).toHaveBeenCalledWith({
      success: true,
      rpName: "Test App",
      rpId: "example.com",
    });

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Reactivating previously revoked passkey",
      expect.objectContaining({
        deviceId: "device-123",
        previousStatus: "revoked",
      }),
    );
  });

  it("should reject if the passkey is already active", async () => {
    // Mock user and existing active credential
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({ id: "user-123" }) // User exists
      .mockResolvedValueOnce({
        id: "passkey-123",
        userId: "user-123",
        deviceId: "device-123",
        platform: "ios",
        status: "active", // Already active
        metadata: "{}",
      });

    // Create endpoint and get handler using type assertion
    const endpoint = createRegisterEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call the handler and expect it to throw
    await expect(handler(mockCtx)).rejects.toThrow(APIError);

    // Verify neither create nor update was called
    expect(mockCtx.context.adapter.create).not.toHaveBeenCalled();
    expect(mockCtx.context.adapter.update).not.toHaveBeenCalled();

    // Verify logging of warning
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Registration failed: Device already registered",
      expect.any(Object),
    );
  });

  it("should reject if the user does not exist", async () => {
    // Mock user not found
    mockCtx.context.adapter.findOne.mockResolvedValueOnce(null);

    // Create endpoint and get handler using type assertion
    const endpoint = createRegisterEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call the handler and expect it to throw
    await expect(handler(mockCtx)).rejects.toThrow(APIError);

    // Verify user check was performed
    expect(mockCtx.context.adapter.findOne).toHaveBeenCalledWith({
      model: "user",
      where: [{ field: "id", operator: "eq", value: "user-123" }],
    });

    // Verify neither create nor update was called
    expect(mockCtx.context.adapter.create).not.toHaveBeenCalled();
    expect(mockCtx.context.adapter.update).not.toHaveBeenCalled();

    // Verify logging of warning
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Registration failed: User not found",
      expect.any(Object),
    );
  });

  it("should handle database errors gracefully", async () => {
    // Mock user exists but database error occurs
    mockCtx.context.adapter.findOne
      .mockResolvedValueOnce({ id: "user-123" }) // User exists
      .mockResolvedValueOnce(null); // No existing credential

    // Mock create to throw error
    mockCtx.context.adapter.create.mockRejectedValueOnce(
      new Error("Database error"),
    );

    // Create endpoint and get handler using type assertion
    const endpoint = createRegisterEndpoint(options);
    const handler = (endpoint as any).handler as EndpointHandler;

    // Call handler and expect it to throw
    await expect(handler(mockCtx)).rejects.toThrow(APIError);

    // Verify error was logged
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Registration error:",
      expect.any(Error),
    );
  });
});
