/**
 * @file Tests for main package exports
 * @description Tests all exports from the main package index
 */

import * as MainExports from '../index';

describe('Main package index', () => {
  it('should export client functionality', () => {
    expect(MainExports.expoPasskeyClient).toBeDefined();
    expect(typeof MainExports.expoPasskeyClient).toBe('function');
  });

  it('should export server functionality', () => {
    expect(MainExports.expoPasskey).toBeDefined();
    expect(typeof MainExports.expoPasskey).toBe('function');
    expect(MainExports.SERVER_ERROR_CODES).toBeDefined();
  });

  it('should export error constants and types', () => {
    expect(MainExports.ERROR_CODES).toBeDefined();
    expect(MainExports.PasskeyError).toBeDefined();
  });

  it('should re-export all types', () => {
    const exportCount = Object.keys(MainExports).length;
    expect(exportCount).toBeGreaterThanOrEqual(7);
  });
});
