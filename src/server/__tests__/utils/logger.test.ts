import { createLogger } from "../../utils/logger";

describe("Logger utility", () => {
  // Save original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // Mock console methods
  beforeEach(() => {
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  // Restore original console methods
  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  it("should create a logger with default settings", () => {
    const logger = createLogger();

    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it("should respect the enabled option", () => {
    // Create a disabled logger
    const disabledLogger = createLogger({ enabled: false });

    disabledLogger.debug("Test debug");
    disabledLogger.info("Test info");
    disabledLogger.warn("Test warn");
    disabledLogger.error("Test error");

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    // Create an enabled logger
    const enabledLogger = createLogger({ enabled: true });

    enabledLogger.debug("Test debug");
    enabledLogger.info("Test info");
    enabledLogger.warn("Test warn");
    enabledLogger.error("Test error");

    // Default level is 'info', so debug shouldn't be called
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith("[ExpoPasskey]", "Test info");
    expect(console.warn).toHaveBeenCalledWith("[ExpoPasskey]", "Test warn");
    expect(console.error).toHaveBeenCalledWith("[ExpoPasskey]", "Test error");
  });

  it("should respect the log level option", () => {
    // Test 'debug' level
    const debugLogger = createLogger({ enabled: true, level: "debug" });

    debugLogger.debug("Test debug");
    expect(console.debug).toHaveBeenCalledWith("[ExpoPasskey]", "Test debug");

    // Reset mocks
    jest.clearAllMocks();

    // Test 'info' level
    const infoLogger = createLogger({ enabled: true, level: "info" });

    infoLogger.debug("Test debug");
    infoLogger.info("Test info");

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith("[ExpoPasskey]", "Test info");

    // Reset mocks
    jest.clearAllMocks();

    // Test 'warn' level
    const warnLogger = createLogger({ enabled: true, level: "warn" });

    warnLogger.debug("Test debug");
    warnLogger.info("Test info");
    warnLogger.warn("Test warn");

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith("[ExpoPasskey]", "Test warn");

    // Reset mocks
    jest.clearAllMocks();

    // Test 'error' level
    const errorLogger = createLogger({ enabled: true, level: "error" });

    errorLogger.debug("Test debug");
    errorLogger.info("Test info");
    errorLogger.warn("Test warn");
    errorLogger.error("Test error");

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[ExpoPasskey]", "Test error");
  });

  it("should handle multiple arguments", () => {
    const logger = createLogger({ enabled: true });

    const testObject = { key: "value" };
    const testError = new Error("Test error");

    logger.info("Test message", testObject, testError);

    expect(console.info).toHaveBeenCalledWith(
      "[ExpoPasskey]",
      "Test message",
      testObject,
      testError,
    );
  });

  it("should default to development mode settings in NODE_ENV=development", () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;

    // Set NODE_ENV to development
    process.env.NODE_ENV = "development";

    const logger = createLogger();

    logger.info("Test info");

    // In development, logging should be enabled by default
    expect(console.info).toHaveBeenCalledWith("[ExpoPasskey]", "Test info");

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
});
