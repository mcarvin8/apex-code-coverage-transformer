'use strict';

import { describe, it, expect } from 'vitest';

import { generateGitHubActions } from '../../src/transformers/generators/generateGitHubActions.js';
import type { GitHubActionsCoverageObject } from '../../src/utils/types.js';

function makeObj(overrides: Partial<GitHubActionsCoverageObject> = {}): GitHubActionsCoverageObject {
  return {
    summary: { totalLines: 0, coveredLines: 0, uncoveredLines: 0, lineRate: 0, fileCount: 0 },
    uncoveredLines: [],
    ...overrides,
  };
}

describe('generateGitHubActions unit tests', () => {
  it('uses singular "file" when fileCount is 1', () => {
    const obj = makeObj({ summary: { totalLines: 2, coveredLines: 2, uncoveredLines: 0, lineRate: 1, fileCount: 1 } });
    const result = generateGitHubActions(obj);
    expect(result).toContain('1 file)');
    expect(result).not.toContain('1 files');
  });

  it('uses plural "files" when fileCount is 2', () => {
    const obj = makeObj({ summary: { totalLines: 4, coveredLines: 4, uncoveredLines: 0, lineRate: 1, fileCount: 2 } });
    const result = generateGitHubActions(obj);
    expect(result).toContain('2 files');
  });

  it('escapes % in the coverage percentage', () => {
    const obj = makeObj({
      summary: { totalLines: 3, coveredLines: 1, uncoveredLines: 2, lineRate: 1 / 3, fileCount: 1 },
    });
    const result = generateGitHubActions(obj);
    // % in data must be encoded as %25
    expect(result).toContain('%25');
  });

  it('escapes % in file path property value', () => {
    const obj = makeObj({
      summary: { totalLines: 1, coveredLines: 0, uncoveredLines: 1, lineRate: 0, fileCount: 1 },
      uncoveredLines: [{ filePath: 'force-app/50%Class.cls', lineNumber: 1 }],
    });
    const result = generateGitHubActions(obj);
    expect(result).toContain('force-app/50%25Class.cls');
  });

  it('escapes colon in file path property value', () => {
    const obj = makeObj({
      summary: { totalLines: 1, coveredLines: 0, uncoveredLines: 1, lineRate: 0, fileCount: 1 },
      uncoveredLines: [{ filePath: 'force-app/C:D.cls', lineNumber: 1 }],
    });
    const result = generateGitHubActions(obj);
    expect(result).toContain('C%3AD');
  });

  it('escapes comma in file path property value', () => {
    const obj = makeObj({
      summary: { totalLines: 1, coveredLines: 0, uncoveredLines: 1, lineRate: 0, fileCount: 1 },
      uncoveredLines: [{ filePath: 'force-app/A,B.cls', lineNumber: 1 }],
    });
    const result = generateGitHubActions(obj);
    expect(result).toContain('A%2CB');
  });

  it('summary line starts with ::notice title=Apex Code Coverage::', () => {
    const obj = makeObj();
    const result = generateGitHubActions(obj);
    expect(result.split('\n')[0]).toContain('::notice title=Apex Code Coverage::');
  });

  it('annotation line contains ::warning file=...,line=...,title=...::...', () => {
    const obj = makeObj({
      summary: { totalLines: 1, coveredLines: 0, uncoveredLines: 1, lineRate: 0, fileCount: 1 },
      uncoveredLines: [{ filePath: 'src/Foo.cls', lineNumber: 7 }],
    });
    const result = generateGitHubActions(obj);
    expect(result).toContain('::warning file=src/Foo.cls,line=7,title=Uncovered Apex line::');
  });

  it('uses custom maxAnnotations limit', () => {
    const lines = Array.from({ length: 10 }, (_, i) => ({ filePath: 'a.cls', lineNumber: i + 1 }));
    const obj = makeObj({
      summary: { totalLines: 10, coveredLines: 0, uncoveredLines: 10, lineRate: 0, fileCount: 1 },
      uncoveredLines: lines,
    });
    const result = generateGitHubActions(obj, 3);
    const warnings = result.split('\n').filter((l) => l.startsWith('::warning'));
    expect(warnings).toHaveLength(3);
  });

  it('emits no warning lines when there are no uncovered lines', () => {
    const obj = makeObj({ summary: { totalLines: 5, coveredLines: 5, uncoveredLines: 0, lineRate: 1, fileCount: 1 } });
    const result = generateGitHubActions(obj);
    const warnings = result.split('\n').filter((l) => l.startsWith('::warning'));
    expect(warnings).toHaveLength(0);
  });
});
