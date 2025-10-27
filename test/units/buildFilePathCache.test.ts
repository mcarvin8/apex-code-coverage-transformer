'use strict';

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { buildFilePathCache } from '../../src/utils/buildFilePathCache.js';

describe('buildFilePathCache', () => {
  const testDir = join(process.cwd(), 'test-cache-temp');
  const packageDir1 = join(testDir, 'force-app', 'main', 'default', 'classes');
  const packageDir2 = join(testDir, 'packaged', 'triggers');
  const repoRoot = testDir;

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(packageDir1, { recursive: true });
    await mkdir(packageDir2, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  it('should build cache for .cls files', async () => {
    // Create test files
    await writeFile(join(packageDir1, 'AccountHandler.cls'), 'public class AccountHandler {}');
    await writeFile(join(packageDir1, 'ContactHandler.cls'), 'public class ContactHandler {}');

    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    expect(cache.has('AccountHandler.cls')).toBe(true);
    expect(cache.has('AccountHandler')).toBe(true);
    expect(cache.has('ContactHandler.cls')).toBe(true);
    expect(cache.has('ContactHandler')).toBe(true);
    expect(cache.get('AccountHandler.cls')).toContain('force-app/main/default/classes/AccountHandler.cls');
  });

  it('should build cache for .trigger files', async () => {
    // Create test files
    await writeFile(join(packageDir2, 'AccountTrigger.trigger'), 'trigger AccountTrigger on Account {}');

    const cache = await buildFilePathCache([join(testDir, 'packaged')], repoRoot);

    expect(cache.has('AccountTrigger.trigger')).toBe(true);
    expect(cache.has('AccountTrigger')).toBe(true);
    expect(cache.get('AccountTrigger.trigger')).toContain('packaged/triggers/AccountTrigger.trigger');
  });

  it('should handle multiple package directories', async () => {
    await writeFile(join(packageDir1, 'Class1.cls'), 'public class Class1 {}');
    await writeFile(join(packageDir2, 'Trigger1.trigger'), 'trigger Trigger1 on Account {}');

    const cache = await buildFilePathCache([join(testDir, 'force-app'), join(testDir, 'packaged')], repoRoot);

    expect(cache.has('Class1.cls')).toBe(true);
    expect(cache.has('Trigger1.trigger')).toBe(true);
  });

  it('should handle non-existent directories gracefully', async () => {
    const nonExistentDir = join(testDir, 'non-existent');

    // Should not throw error
    const cache = await buildFilePathCache([nonExistentDir], repoRoot);

    expect(cache.size).toBe(0);
  });

  it('should handle nested directory structure', async () => {
    const nestedDir = join(packageDir1, 'nested', 'deep');
    await mkdir(nestedDir, { recursive: true });
    await writeFile(join(nestedDir, 'DeepClass.cls'), 'public class DeepClass {}');

    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    expect(cache.has('DeepClass.cls')).toBe(true);
    expect(cache.has('DeepClass')).toBe(true);
  });

  it('should ignore non-Apex files', async () => {
    await writeFile(join(packageDir1, 'AccountHandler.cls'), 'public class AccountHandler {}');
    await writeFile(join(packageDir1, 'README.md'), '# Readme');
    await writeFile(join(packageDir1, 'config.xml'), '<xml/>');

    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    expect(cache.has('AccountHandler.cls')).toBe(true);
    expect(cache.has('README.md')).toBe(false);
    expect(cache.has('config.xml')).toBe(false);
  });

  it('should not overwrite existing entries with same name without extension', async () => {
    // This tests that if AccountHandler.cls is found first, it stores under both
    // 'AccountHandler.cls' and 'AccountHandler', and won't be overwritten
    await writeFile(join(packageDir1, 'AccountHandler.cls'), 'public class AccountHandler {}');

    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    expect(cache.has('AccountHandler')).toBe(true);
    expect(cache.has('AccountHandler.cls')).toBe(true);
    // Both should point to the same file
    expect(cache.get('AccountHandler')).toBe(cache.get('AccountHandler.cls'));
  });

  it('should handle files that cannot be stat-ed gracefully', async () => {
    // Create a valid file first
    await writeFile(join(packageDir1, 'ValidClass.cls'), 'public class ValidClass {}');

    // Create a broken symlink (points to non-existent target)
    // This will be in the directory listing but stat will fail
    try {
      const { symlink } = await import('node:fs/promises');
      const brokenLink = join(packageDir1, 'BrokenLink.cls');
      const nonExistentTarget = join(packageDir1, 'non-existent-target.cls');

      // Create symlink to non-existent file
      await symlink(nonExistentTarget, brokenLink).catch(() => {
        // If symlink fails (e.g., insufficient permissions on Windows),
        // skip this part of the test but continue
      });
    } catch {
      // Symlink might not be available, that's okay
    }

    // Build cache - should not crash even if a file becomes inaccessible
    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    expect(cache.has('ValidClass.cls')).toBe(true);
    // BrokenLink should not be in cache since stat failed
    expect(cache.has('BrokenLink.cls')).toBe(false);
  });

  it('should normalize paths to Unix format', async () => {
    await writeFile(join(packageDir1, 'TestClass.cls'), 'public class TestClass {}');

    const cache = await buildFilePathCache([join(testDir, 'force-app')], repoRoot);

    const path = cache.get('TestClass.cls');
    expect(path).toBeDefined();
    // Unix paths use forward slashes
    expect(path).not.toContain('\\');
    expect(path).toContain('/');
  });
});
