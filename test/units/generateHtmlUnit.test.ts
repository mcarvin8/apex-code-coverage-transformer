'use strict';

import { describe, it, expect } from 'vitest';

import { generateHtml } from '../../src/transformers/generators/generateHtml.js';
import type { HtmlCoverageObject } from '../../src/utils/types.js';

function makeObj(overrides: Partial<HtmlCoverageObject> = {}): HtmlCoverageObject {
  return {
    summary: { totalLines: 0, coveredLines: 0, uncoveredLines: 0, lineRate: 0 },
    packageSummaries: [],
    files: [],
    ...overrides,
  };
}

describe('generateHtml unit tests', () => {
  it('uses green color (#4caf50) for coverage >= 80%', () => {
    const obj = makeObj({ summary: { totalLines: 10, coveredLines: 8, uncoveredLines: 2, lineRate: 0.8 } });
    const result = generateHtml(obj);
    expect(result).toContain('#4caf50');
  });

  it('uses orange color (#ff9800) for coverage >= 60% and < 80%', () => {
    const obj = makeObj({ summary: { totalLines: 10, coveredLines: 7, uncoveredLines: 3, lineRate: 0.7 } });
    const result = generateHtml(obj);
    // Note: summary color would be orange since 70% is in [60%, 80%)
    expect(result).toContain('#ff9800');
  });

  it('uses red color (#f44336) for coverage < 60%', () => {
    const obj = makeObj({ summary: { totalLines: 10, coveredLines: 5, uncoveredLines: 5, lineRate: 0.5 } });
    const result = generateHtml(obj);
    expect(result).toContain('#f44336');
  });

  it('formats coverage as 2 decimal places (without % in formatPercent itself)', () => {
    const obj = makeObj({ summary: { totalLines: 3, coveredLines: 1, uncoveredLines: 2, lineRate: 1 / 3 } });
    const result = generateHtml(obj);
    // 33.33 should appear in the output (formatPercent returns "33.33" not "33.33%")
    expect(result).toContain('33.33');
  });

  it('includes package summary table when packageSummaries is non-empty', () => {
    const obj = makeObj({
      packageSummaries: [
        {
          directory: 'force-app',
          fileCount: 2,
          totalLines: 10,
          coveredLines: 8,
          uncoveredLines: 2,
          lineRate: 0.8,
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('Package directory coverage');
    expect(result).toContain('force-app');
  });

  it('omits package summary table when packageSummaries is empty', () => {
    const obj = makeObj();
    const result = generateHtml(obj);
    expect(result).not.toContain('Package directory coverage');
  });

  it('marks covered lines with class "covered" and green background', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [{ lineNumber: 1, hitCount: 1, covered: true, content: 'foo' }],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('class="covered"');
    expect(result).toContain('#c8e6c9');
  });

  it('marks uncovered lines with class "uncovered" and red background', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 0,
          uncoveredLines: 1,
          lineRate: 0,
          lines: [{ lineNumber: 1, hitCount: 0, covered: false, content: 'bar' }],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('class="uncovered"');
    expect(result).toContain('#ffcdd2');
  });

  it('escapes HTML special characters in line content', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [{ lineNumber: 1, hitCount: 1, covered: true, content: '<script>alert("xss")</script>' }],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&quot;xss&quot;');
    expect(result).not.toContain('<script>alert');
  });

  it('groups files by directory in the output', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'a-dir/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [],
        },
        {
          filePath: 'b-dir/B.cls',
          fileName: 'B',
          totalLines: 1,
          coveredLines: 0,
          uncoveredLines: 1,
          lineRate: 0,
          lines: [],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('a-dir/');
    expect(result).toContain('b-dir/');
  });

  it('always contains the Code Coverage Report title', () => {
    const obj = makeObj();
    const result = generateHtml(obj);
    expect(result).toContain('Code Coverage Report');
  });

  it('package summary row includes directory name, fileCount, and coverage percent', () => {
    const obj = makeObj({
      packageSummaries: [
        {
          directory: 'force-app',
          fileCount: 3,
          totalLines: 10,
          coveredLines: 8,
          uncoveredLines: 2,
          lineRate: 0.8,
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('force-app');
    expect(result).toContain('80.00');
  });
});
