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

  it('uses orange color (#ff9800) for lineRate exactly at 0.6 boundary', () => {
    const obj = makeObj({ summary: { totalLines: 10, coveredLines: 6, uncoveredLines: 4, lineRate: 0.6 } });
    const result = generateHtml(obj);
    expect(result).toContain('#ff9800');
    expect(result).not.toContain('#f44336');
  });

  it('uses red color (#f44336) for lineRate just below 0.6 (0.59)', () => {
    const obj = makeObj({ summary: { totalLines: 100, coveredLines: 59, uncoveredLines: 41, lineRate: 0.59 } });
    const result = generateHtml(obj);
    expect(result).toContain('#f44336');
    expect(result).not.toContain('#ff9800');
  });

  it("escapes > and ' HTML special characters in line content", () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [{ lineNumber: 1, hitCount: 1, covered: true, content: "> it's" }],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('&gt;');
    expect(result).toContain('&#039;');
  });

  it('renders directories in alphabetical order', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'z-dir/Z.cls',
          fileName: 'Z',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [],
        },
        {
          filePath: 'a-dir/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [],
        },
      ],
    });
    const result = generateHtml(obj);
    const aIdx = result.indexOf('a-dir/');
    const zIdx = result.indexOf('z-dir/');
    expect(aIdx).toBeGreaterThanOrEqual(0);
    expect(zIdx).toBeGreaterThanOrEqual(0);
    expect(aIdx).toBeLessThan(zIdx);
  });

  it('renders all files within same directory (groupFilesByDir push)', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/First.cls',
          fileName: 'First',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [],
        },
        {
          filePath: 'src/Second.cls',
          fileName: 'Second',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('src/First.cls');
    expect(result).toContain('src/Second.cls');
  });

  it('generates file detail div with ID derived from filePath replacing non-alphanumeric chars with dashes', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/sub/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [{ lineNumber: 1, hitCount: 1, covered: true, content: '' }],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('id="file-src-sub-A-cls"');
  });

  it('escapes single quotes in filePath for onclick handler', () => {
    const obj = makeObj({
      files: [
        {
          filePath: "src/O'Reilly.cls",
          fileName: "O'Reilly",
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain("O\\'Reilly");
  });

  it('renders file coverage stats with covered/total lines and percent in file-stats span', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/A.cls',
          fileName: 'A',
          totalLines: 4,
          coveredLines: 3,
          uncoveredLines: 1,
          lineRate: 0.75,
          lines: [],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('3/4 lines');
    expect(result).toContain('75.00%');
  });

  it('renders summary stat-value divs for totalLines, coveredLines, uncoveredLines, and file count', () => {
    const obj = makeObj({
      summary: { totalLines: 200, coveredLines: 160, uncoveredLines: 40, lineRate: 0.8 },
      files: [
        {
          filePath: 'a/A.cls',
          fileName: 'A',
          totalLines: 100,
          coveredLines: 80,
          uncoveredLines: 20,
          lineRate: 0.8,
          lines: [],
        },
        {
          filePath: 'a/B.cls',
          fileName: 'B',
          totalLines: 100,
          coveredLines: 80,
          uncoveredLines: 20,
          lineRate: 0.8,
          lines: [],
        },
        {
          filePath: 'a/C.cls',
          fileName: 'C',
          totalLines: 100,
          coveredLines: 80,
          uncoveredLines: 20,
          lineRate: 0.8,
          lines: [],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('class="stat-value">200<');
    expect(result).toContain('class="stat-value">160<');
    expect(result).toContain('class="stat-value">40<');
    expect(result).toContain('class="stat-value">3<');
  });

  it('renders all package summaries when multiple packages exist', () => {
    const obj = makeObj({
      packageSummaries: [
        { directory: 'pkg-alpha', fileCount: 1, totalLines: 5, coveredLines: 5, uncoveredLines: 0, lineRate: 1 },
        { directory: 'pkg-beta', fileCount: 3, totalLines: 10, coveredLines: 3, uncoveredLines: 7, lineRate: 0.3 },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('pkg-alpha');
    expect(result).toContain('pkg-beta');
    expect(result).toContain('class="package-stat">1<');
    expect(result).toContain('class="package-stat">3<');
  });

  it('line row shows correct line number and hit count', () => {
    const obj = makeObj({
      files: [
        {
          filePath: 'src/A.cls',
          fileName: 'A',
          totalLines: 1,
          coveredLines: 1,
          uncoveredLines: 0,
          lineRate: 1,
          lines: [{ lineNumber: 42, hitCount: 7, covered: true, content: 'some code' }],
        },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('class="line-number">42<');
    expect(result).toContain('class="hit-count">7<');
    expect(result).toContain('some code');
  });

  it('package summary row shows totalLines, coveredLines, and uncoveredLines', () => {
    const obj = makeObj({
      packageSummaries: [
        { directory: 'force-app', fileCount: 1, totalLines: 30, coveredLines: 21, uncoveredLines: 9, lineRate: 0.7 },
      ],
    });
    const result = generateHtml(obj);
    expect(result).toContain('class="package-stat">30<');
    expect(result).toContain('class="package-stat">21<');
    expect(result).toContain('class="package-stat">9<');
  });

  it('coverage percent string in summary shows two decimal places', () => {
    const obj = makeObj({ summary: { totalLines: 3, coveredLines: 2, uncoveredLines: 1, lineRate: 2 / 3 } });
    const result = generateHtml(obj);
    expect(result).toContain('66.67%');
  });
});
