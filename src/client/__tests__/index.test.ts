import * as coreExports from '../core';
import * as indexExports from '../index';

describe('src/client/index.ts exports', () => {
  it('should re-export everything from ~/client/core', () => {
    // Check that all exports from core exist in index
    expect(indexExports).toEqual(coreExports);
  });
});
