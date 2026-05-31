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
});
