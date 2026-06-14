'use strict';

import { describe, it, expect } from 'vitest';

import { CoberturaCoverageHandler } from '../../src/handlers/cobertura.js';

describe('CoberturaCoverageHandler expanded unit tests', () => {
  it('sets @line-rate based on coveredLines / totalLines per class', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 0, '4': 0 });
    const result = handler.finalize();
    const cls = result.coverage.packages.package[0].classes.class[0];
    // 2/4 = 0.5
    expect(cls['@line-rate']).toBe(0.5);
  });

  it('populates line hits correctly: @hits=1 for covered, @hits=0 for uncovered', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    const lines = result.coverage.packages.package[0].classes.class[0].lines.line;
    const line1 = lines.find((l) => l['@number'] === 1);
    const line2 = lines.find((l) => l['@number'] === 2);
    expect(line1?.['@hits']).toBe(1);
    expect(line2?.['@hits']).toBe(0);
  });

  it('sets @branch="false" on every line', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 0, '3': 1 });
    const result = handler.finalize();
    const lines = result.coverage.packages.package[0].classes.class[0].lines.line;
    expect(lines.every((l) => l['@branch'] === 'false')).toBe(true);
  });

  it('accumulates @lines-valid and @lines-covered across files', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 0 });
    handler.processFile('pkg/B.cls', 'B', { '1': 1, '2': 1 });
    const result = handler.finalize();
    expect(result.coverage['@lines-valid']).toBe(4);
    expect(result.coverage['@lines-covered']).toBe(3);
  });

  it('computes global @line-rate correctly', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 1, '4': 0 });
    const result = handler.finalize();
    // 3/4 = 0.75
    expect(result.coverage['@line-rate']).toBe(0.75);
  });

  it('@branch-rate is 1 on both class and global', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage['@branch-rate']).toBe(1);
    expect(result.coverage.packages.package[0]['@branch-rate']).toBe(1);
  });

  it('groups files from same root directory into same package', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('force-app/A.cls', 'A', { '1': 1 });
    handler.processFile('force-app/B.cls', 'B', { '1': 0 });
    const result = handler.finalize();
    expect(result.coverage.packages.package).toHaveLength(1);
    expect(result.coverage.packages.package[0]['@name']).toBe('force-app');
  });

  it('creates separate packages for different root directories', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('force-app/A.cls', 'A', { '1': 1 });
    handler.processFile('packaged/B.cls', 'B', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage.packages.package).toHaveLength(2);
  });

  it('@complexity is 0 on coverage element', () => {
    const handler = new CoberturaCoverageHandler();
    const result = handler.finalize();
    expect(result.coverage['@complexity']).toBe(0);
  });

  it('@branches-valid and @branches-covered are 0', () => {
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage['@branches-valid']).toBe(0);
    expect(result.coverage['@branches-covered']).toBe(0);
  });

  // ── ArithmeticOperator mutation killer (cobertura.ts:89) ──
  // pkg['@line-rate'] = totalLines / totalClasses
  // where totalLines = sum(cls['@line-rate'] * cls.lines.line.length)  (weighted rates)
  // and   totalClasses = sum(cls.lines.line.length)
  // Mutant: totalLines * totalClasses  → would produce wrong (much larger) value
  // Mutant: ConditionalExpression always false → always 0 even when totalClasses > 0

  it('package @line-rate is weighted average of class line-rates (division, not multiplication)', () => {
    const handler = new CoberturaCoverageHandler();
    // File A: 2 covered out of 4 lines → @line-rate = 0.5
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 0, '4': 0 });
    // File B: 3 covered out of 3 lines → @line-rate = 1.0
    handler.processFile('pkg/B.cls', 'B', { '1': 1, '2': 1, '3': 1 });
    const result = handler.finalize();

    const pkg = result.coverage.packages.package[0];
    // totalLines (weighted) = 0.5*4 + 1.0*3 = 2 + 3 = 5
    // totalClasses (line count) = 4 + 3 = 7
    // correct pkg @line-rate = 5/7 ≈ 0.7143
    // mutant (*) would give: 5 * 7 = 35 → parseFloat((35).toFixed(4)) = 35 → clearly wrong
    expect(pkg['@line-rate']).toBeCloseTo(5 / 7, 3);
    expect(pkg['@line-rate']).toBeLessThanOrEqual(1); // rules out multiplication mutant
    expect(pkg['@line-rate']).toBeGreaterThan(0);
  });

  it('package @line-rate is nonzero when lines exist (ConditionalExpression false mutant killer)', () => {
    const handler = new CoberturaCoverageHandler();
    // 2 covered out of 4 → pkg @line-rate should be 0.5, not 0
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 0, '4': 0 });
    const result = handler.finalize();

    const pkg = result.coverage.packages.package[0];
    // Mutant (always false): pkg['@line-rate'] would always be 0 regardless of coverage
    expect(pkg['@line-rate']).toBeGreaterThan(0);
    expect(pkg['@line-rate']).toBe(0.5);
  });

  it('@version is "0.1" in the coverage element', () => {
    const handler = new CoberturaCoverageHandler();
    const result = handler.finalize();
    expect(result.coverage['@version']).toBe('0.1');
  });

  it('sources.source is ["."] in the coverage element', () => {
    const handler = new CoberturaCoverageHandler();
    const result = handler.finalize();
    expect(result.coverage.sources.source).toEqual(['.']);
  });

  it('@line-rate sort callback correctly compares strings (ArrowFunction mutant killer)', () => {
    // The sort on packages uses a.localeCompare(b). Mutant replaces the arrow function body with undefined.
    // We test that after finalize, packages are in alphabetical order.
    const handler = new CoberturaCoverageHandler();
    handler.processFile('z-pkg/A.cls', 'A', { '1': 1 });
    handler.processFile('a-pkg/B.cls', 'B', { '1': 1 });
    handler.processFile('m-pkg/C.cls', 'C', { '1': 1 });
    const result = handler.finalize();
    const names = result.coverage.packages.package.map((p) => p['@name']);
    expect(names).toEqual(['a-pkg', 'm-pkg', 'z-pkg']);
  });
});
