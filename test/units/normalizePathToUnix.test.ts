'use strict';

import { describe, it, expect } from 'vitest';

import { normalizePathToUnix } from '../../src/utils/normalizePathToUnix.js';

describe('normalizePathToUnix', () => {
  it('replaces backslashes with forward slashes', () => {
    expect(normalizePathToUnix('a\\b\\c')).toBe('a/b/c');
  });

  it('replaces multiple consecutive backslashes', () => {
    expect(normalizePathToUnix('a\\\\b')).toBe('a//b');
  });

  it('leaves forward slashes unchanged', () => {
    expect(normalizePathToUnix('a/b/c')).toBe('a/b/c');
  });

  it('handles mixed slashes', () => {
    expect(normalizePathToUnix('force-app\\main\\default/classes/Foo.cls')).toBe(
      'force-app/main/default/classes/Foo.cls',
    );
  });

  it('returns empty string unchanged', () => {
    expect(normalizePathToUnix('')).toBe('');
  });

  it('handles paths with no slashes', () => {
    expect(normalizePathToUnix('Foo.cls')).toBe('Foo.cls');
  });
});
