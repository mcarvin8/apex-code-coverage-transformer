'use strict';

import { describe, it, expect } from 'vitest';

import { generateMarkdown } from '../../src/transformers/generators/generateMarkdown.js';
import type { MarkdownCoverageObject } from '../../src/utils/types.js';

function makeObj(overrides: Partial<MarkdownCoverageObject> = {}): MarkdownCoverageObject {
  return {
    summary: { totalLines: 0, coveredLines: 0, uncoveredLines: 0, lineRate: 0, fileCount: 0 },
    packages: [],
    files: [],
    ...overrides,
  };
}

describe('generateMarkdown unit tests', () => {
  it('uses singular "file" when fileCount is 1', () => {
    const obj = makeObj({
      summary: { totalLines: 10, coveredLines: 8, uncoveredLines: 2, lineRate: 0.8, fileCount: 1 },
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('1 file)');
    expect(result).not.toContain('1 files');
  });

  it('uses plural "files" when fileCount is 2', () => {
    const obj = makeObj({
      summary: { totalLines: 10, coveredLines: 8, uncoveredLines: 2, lineRate: 0.8, fileCount: 2 },
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('2 files');
  });

  it('omits package table section when packages is empty', () => {
    const obj = makeObj();
    const result = generateMarkdown(obj);
    expect(result).not.toContain('## Package directory coverage');
  });

  it('includes package table section when packages is non-empty', () => {
    const obj = makeObj({
      packages: [
        { directory: 'force-app', fileCount: 1, totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 },
      ],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('## Package directory coverage');
    expect(result).toContain('force-app');
  });

  it('omits file table section when files is empty', () => {
    const obj = makeObj();
    const result = generateMarkdown(obj);
    expect(result).not.toContain('## File coverage');
  });

  it('includes file table section when files is non-empty', () => {
    const obj = makeObj({
      files: [{ filePath: 'force-app/main/Foo.cls', totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 }],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('## File coverage');
    expect(result).toContain('force-app/main/Foo.cls');
  });

  it('formats line rate as percentage with 2 decimal places', () => {
    const obj = makeObj({
      summary: { totalLines: 3, coveredLines: 1, uncoveredLines: 2, lineRate: 1 / 3, fileCount: 1 },
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('33.33%');
  });

  it('always includes the summary heading', () => {
    const obj = makeObj();
    const result = generateMarkdown(obj);
    expect(result).toContain('# Apex Code Coverage Report');
  });

  it('package table header contains expected columns', () => {
    const obj = makeObj({
      packages: [
        { directory: 'force-app', fileCount: 1, totalLines: 2, coveredLines: 1, uncoveredLines: 1, lineRate: 0.5 },
      ],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('Directory');
    expect(result).toContain('Files');
    expect(result).toContain('Coverage');
  });

  it('file table includes "sorted with lowest coverage first" note', () => {
    const obj = makeObj({
      files: [{ filePath: 'a.cls', totalLines: 2, coveredLines: 1, uncoveredLines: 1, lineRate: 0.5 }],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('lowest coverage first');
  });
});
