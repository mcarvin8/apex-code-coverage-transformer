'use strict';

import { describe, expect, it } from 'vitest';

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

  // ── StringLiteral mutation killers for generateMarkdown ──

  it('summary heading is exactly "# Apex Code Coverage Report"', () => {
    const obj = makeObj();
    const result = generateMarkdown(obj);
    // Mutant replaces the string with "Stryker was here!" or ""
    expect(result).toContain('# Apex Code Coverage Report');
    expect(result).not.toContain('Stryker');
  });

  it('summary contains "Overall coverage:" label', () => {
    const obj = makeObj({
      summary: { totalLines: 10, coveredLines: 8, uncoveredLines: 2, lineRate: 0.8, fileCount: 1 },
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('**Overall coverage:**');
  });

  it('summary line contains "/" between covered and total lines', () => {
    const obj = makeObj({
      summary: { totalLines: 20, coveredLines: 15, uncoveredLines: 5, lineRate: 0.75, fileCount: 2 },
    });
    const result = generateMarkdown(obj);
    // Checks that the "15 / 20 lines" format (with slash) is present
    expect(result).toContain('15 / 20');
  });

  it('summary line contains "lines across" text', () => {
    const obj = makeObj({
      summary: { totalLines: 10, coveredLines: 5, uncoveredLines: 5, lineRate: 0.5, fileCount: 3 },
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('lines across');
  });

  it('package table heading is "## Package directory coverage"', () => {
    const obj = makeObj({
      packages: [{ directory: 'pkg', fileCount: 1, totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 }],
    });
    const result = generateMarkdown(obj);
    // Mutant replaces with "" → section heading disappears
    expect(result).toContain('## Package directory coverage');
  });

  it('package table header row contains expected column names', () => {
    const obj = makeObj({
      packages: [{ directory: 'pkg', fileCount: 1, totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 }],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('Directory');
    expect(result).toContain('Files');
    expect(result).toContain('Lines');
    expect(result).toContain('Covered');
    expect(result).toContain('Coverage');
  });

  it('package table separator row uses pipe-separated dashes', () => {
    const obj = makeObj({
      packages: [{ directory: 'pkg', fileCount: 1, totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 }],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('| --- |');
  });

  it('file table heading is "## File coverage"', () => {
    const obj = makeObj({
      files: [{ filePath: 'a.cls', totalLines: 5, coveredLines: 3, uncoveredLines: 2, lineRate: 0.6 }],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('## File coverage');
  });

  it('file table header row contains "File" column label', () => {
    const obj = makeObj({
      files: [{ filePath: 'a.cls', totalLines: 5, coveredLines: 3, uncoveredLines: 2, lineRate: 0.6 }],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('| File |');
  });

  it('package row contains the directory name', () => {
    const obj = makeObj({
      packages: [
        { directory: 'force-app', fileCount: 2, totalLines: 8, coveredLines: 6, uncoveredLines: 2, lineRate: 0.75 },
      ],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('force-app');
    expect(result).toContain('75.00%');
  });

  it('file row contains the file path', () => {
    const obj = makeObj({
      files: [
        { filePath: 'force-app/main/MyClass.cls', totalLines: 4, coveredLines: 3, uncoveredLines: 1, lineRate: 0.75 },
      ],
    });
    const result = generateMarkdown(obj);
    expect(result).toContain('force-app/main/MyClass.cls');
    expect(result).toContain('75.00%');
  });

  it('sections are joined by blank lines (double newline between sections)', () => {
    const obj = makeObj({
      summary: { totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8, fileCount: 1 },
      packages: [{ directory: 'pkg', fileCount: 1, totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 }],
      files: [{ filePath: 'pkg/A.cls', totalLines: 5, coveredLines: 4, uncoveredLines: 1, lineRate: 0.8 }],
    });
    const result = generateMarkdown(obj);
    // Two consecutive newlines between sections
    expect(result).toContain('\n\n');
  });
});
