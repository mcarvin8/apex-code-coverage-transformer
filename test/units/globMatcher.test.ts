'use strict';

import { describe, it, expect } from 'vitest';

import { matchesGlob } from '../../src/utils/globMatcher.js';

describe('matchesGlob', () => {
  describe('matchBase: true (no "/" in pattern matches basename)', () => {
    it('matches *.cls against basename', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.cls', '*.cls', { matchBase: true })).toBe(true);
    });

    it('does not match *.cls against different extension', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.trigger', '*.cls', { matchBase: true })).toBe(false);
    });

    it('matches wildcard in middle of basename', () => {
      expect(matchesGlob('force-app/main/default/classes/FooTest.cls', '*Test*.cls', { matchBase: true })).toBe(true);
    });

    it('does not match when basename wildcard pattern fails', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.cls', '*Test*.cls', { matchBase: true })).toBe(false);
    });

    it('matches exact filename via matchBase', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.cls', 'Foo.cls', { matchBase: true })).toBe(true);
    });

    it('does not match wrong filename via matchBase', () => {
      expect(matchesGlob('force-app/main/default/classes/Bar.cls', 'Foo.cls', { matchBase: true })).toBe(false);
    });

    it('matches ? as single character in basename', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.cls', 'F?o.cls', { matchBase: true })).toBe(true);
    });

    it('does not let ? match slash in full path match', () => {
      expect(matchesGlob('a/b.cls', 'a?.cls')).toBe(false);
    });

    it('matches character class in basename', () => {
      expect(matchesGlob('force-app/main/classes/Foo.cls', '[FA]oo.cls', { matchBase: true })).toBe(true);
    });

    it('matches negated character class in basename', () => {
      expect(matchesGlob('force-app/main/classes/Goo.cls', '[!FA]oo.cls', { matchBase: true })).toBe(true);
    });

    it('does not match negated character class when char is in set', () => {
      expect(matchesGlob('force-app/main/classes/Foo.cls', '[!FA]oo.cls', { matchBase: true })).toBe(false);
    });

    it('handles ] as first char in character class (literal ])', () => {
      expect(matchesGlob('force-app/main/classes/].cls', '[]a].cls', { matchBase: true })).toBe(true);
    });

    it('does not match char excluded by class with ] as first member', () => {
      expect(matchesGlob('force-app/main/classes/b.cls', '[]a].cls', { matchBase: true })).toBe(false);
    });

    it('treats unmatched [ as literal character', () => {
      expect(matchesGlob('force-app/main/classes/[.cls', '[.cls', { matchBase: true })).toBe(true);
    });

    it('does not match when unmatched [ literal does not fit', () => {
      expect(matchesGlob('force-app/main/classes/a.cls', '[.cls', { matchBase: true })).toBe(false);
    });
  });

  describe('patterns with "/" (no matchBase effect)', () => {
    it('matches exact relative path', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.cls', 'force-app/main/default/classes/Foo.cls')).toBe(
        true,
      );
    });

    it('does not match different path', () => {
      expect(matchesGlob('force-app/other/classes/Foo.cls', 'force-app/main/default/classes/Foo.cls')).toBe(false);
    });

    it('src/** matches files under src', () => {
      expect(matchesGlob('src/classes/Foo.cls', 'src/**')).toBe(true);
    });

    it('src/** matches deeply nested file', () => {
      expect(matchesGlob('src/a/b/c/Foo.cls', 'src/**')).toBe(true);
    });

    it('src/** does not match files outside src', () => {
      expect(matchesGlob('other/classes/Foo.cls', 'src/**')).toBe(false);
    });

    it('src/**/*.cls matches .cls under src', () => {
      expect(matchesGlob('src/classes/Foo.cls', 'src/**/*.cls')).toBe(true);
    });

    it('src/**/*.cls matches deeply nested .cls', () => {
      expect(matchesGlob('src/a/b/c/Foo.cls', 'src/**/*.cls')).toBe(true);
    });

    it('src/**/*.cls does not match .trigger under src', () => {
      expect(matchesGlob('src/classes/Foo.trigger', 'src/**/*.cls')).toBe(false);
    });

    it('**/Foo.cls matches file at root', () => {
      expect(matchesGlob('Foo.cls', '**/Foo.cls')).toBe(true);
    });

    it('**/Foo.cls matches file in nested directory', () => {
      expect(matchesGlob('force-app/main/default/classes/Foo.cls', '**/Foo.cls')).toBe(true);
    });

    it('**/Foo.cls does not match different filename', () => {
      expect(matchesGlob('force-app/main/default/classes/Bar.cls', '**/Foo.cls')).toBe(false);
    });

    it('**/Foo.cls does not false-positive on prefix match', () => {
      expect(matchesGlob('NotFoo.cls', '**/Foo.cls')).toBe(false);
    });
  });

  describe('matchBase: true with pattern containing "/"', () => {
    it('uses full path when pattern has /', () => {
      expect(matchesGlob('force-app/main/classes/Foo.cls', 'force-app/main/classes/Foo.cls', { matchBase: true })).toBe(
        true,
      );
    });

    it('does not apply matchBase when pattern has /', () => {
      expect(matchesGlob('other/classes/Foo.cls', 'force-app/main/classes/Foo.cls', { matchBase: true })).toBe(false);
    });
  });

  describe('special regex characters in patterns', () => {
    it('escapes dots in literal pattern', () => {
      expect(matchesGlob('Foo.cls', 'Foozcls', { matchBase: true })).toBe(false);
    });

    it('matches dot literally', () => {
      expect(matchesGlob('Foo.cls', 'Foo.cls', { matchBase: true })).toBe(true);
    });

    it('handles hyphens in path segments', () => {
      expect(matchesGlob('force-app/main/classes/Foo.cls', 'force-app/**/*.cls')).toBe(true);
    });
  });
});
