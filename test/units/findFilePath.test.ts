'use strict';

import { describe, it, expect } from '@jest/globals';
import { findFilePath } from '../../src/utils/findFilePath.js';

describe('findFilePath', () => {
  describe('with cache', () => {
    it('should find file with exact match', () => {
      const cache = new Map<string, string>([
        ['AccountHandler.cls', 'force-app/main/default/classes/AccountHandler.cls'],
        ['AccountHandler', 'force-app/main/default/classes/AccountHandler.cls'],
      ]);

      const result = findFilePath('AccountHandler.cls', cache);
      expect(result).toBe('force-app/main/default/classes/AccountHandler.cls');
    });

    it('should find file by name without extension', () => {
      const cache = new Map<string, string>([
        ['AccountHandler.cls', 'force-app/main/default/classes/AccountHandler.cls'],
        ['AccountHandler', 'force-app/main/default/classes/AccountHandler.cls'],
      ]);

      const result = findFilePath('AccountHandler', cache);
      expect(result).toBe('force-app/main/default/classes/AccountHandler.cls');
    });

    it('should find .cls file when searching by name without extension', () => {
      const cache = new Map<string, string>([
        ['ContactHandler.cls', 'force-app/main/default/classes/ContactHandler.cls'],
        ['ContactHandler', 'force-app/main/default/classes/ContactHandler.cls'],
      ]);

      const result = findFilePath('ContactHandler', cache);
      expect(result).toBe('force-app/main/default/classes/ContactHandler.cls');
    });

    it('should find .trigger file when searching by name without extension', () => {
      const cache = new Map<string, string>([
        ['AccountTrigger.trigger', 'packaged/triggers/AccountTrigger.trigger'],
        ['AccountTrigger', 'packaged/triggers/AccountTrigger.trigger'],
      ]);

      const result = findFilePath('AccountTrigger', cache);
      expect(result).toBe('packaged/triggers/AccountTrigger.trigger');
    });

    it('should return undefined when file not found', () => {
      const cache = new Map<string, string>([
        ['AccountHandler.cls', 'force-app/main/default/classes/AccountHandler.cls'],
      ]);

      const result = findFilePath('NonExistentClass', cache);
      expect(result).toBeUndefined();
    });

    it('should return undefined when searching for non-Apex file', () => {
      const cache = new Map<string, string>([
        ['AccountHandler.cls', 'force-app/main/default/classes/AccountHandler.cls'],
      ]);

      const result = findFilePath('README.md', cache);
      expect(result).toBeUndefined();
    });

    it('should prioritize exact match over extension matches', () => {
      const cache = new Map<string, string>([
        ['TestFile', 'exact/match/TestFile'],
        ['TestFile.cls', 'with/cls/TestFile.cls'],
      ]);

      const result = findFilePath('TestFile', cache);
      expect(result).toBe('exact/match/TestFile');
    });

    it('should try .cls extension when exact match not found', () => {
      const cache = new Map<string, string>([['TestClass.cls', 'force-app/classes/TestClass.cls']]);

      const result = findFilePath('TestClass', cache);
      expect(result).toBe('force-app/classes/TestClass.cls');
    });

    it('should try .trigger extension when exact and .cls not found', () => {
      const cache = new Map<string, string>([['TestTrigger.trigger', 'force-app/triggers/TestTrigger.trigger']]);

      const result = findFilePath('TestTrigger', cache);
      expect(result).toBe('force-app/triggers/TestTrigger.trigger');
    });

    it('should return undefined when all lookup attempts fail', () => {
      const cache = new Map<string, string>([['SomeClass.cls', 'force-app/classes/SomeClass.cls']]);

      const result = findFilePath('OtherClass', cache);
      expect(result).toBeUndefined();
    });
  });

  describe('without cache', () => {
    it('should return undefined when cache is not provided', () => {
      const result = findFilePath('AccountHandler');
      expect(result).toBeUndefined();
    });

    it('should return undefined for any filename when cache is undefined', () => {
      const result = findFilePath('TestClass', undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty cache', () => {
      const cache = new Map<string, string>();
      const result = findFilePath('AccountHandler', cache);
      expect(result).toBeUndefined();
    });

    it('should handle special characters in filename', () => {
      const cache = new Map<string, string>([
        ['Test$Class.cls', 'force-app/classes/Test$Class.cls'],
        ['Test$Class', 'force-app/classes/Test$Class.cls'],
      ]);

      const result = findFilePath('Test$Class', cache);
      expect(result).toBe('force-app/classes/Test$Class.cls');
    });

    it('should handle filenames with numbers', () => {
      const cache = new Map<string, string>([
        ['Account2Handler.cls', 'force-app/classes/Account2Handler.cls'],
        ['Account2Handler', 'force-app/classes/Account2Handler.cls'],
      ]);

      const result = findFilePath('Account2Handler', cache);
      expect(result).toBe('force-app/classes/Account2Handler.cls');
    });

    it('should be case-sensitive', () => {
      const cache = new Map<string, string>([
        ['AccountHandler.cls', 'force-app/classes/AccountHandler.cls'],
        ['AccountHandler', 'force-app/classes/AccountHandler.cls'],
      ]);

      const result = findFilePath('accounthandler', cache);
      expect(result).toBeUndefined();
    });
  });
});
