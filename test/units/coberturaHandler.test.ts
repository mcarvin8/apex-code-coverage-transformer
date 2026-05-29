/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from 'vitest';

import { CoberturaCoverageHandler } from '../../src/handlers/cobertura.js';

describe('CoberturaCoverageHandler branch coverage', () => {
  it('processes a file with zero total lines without producing NaN line-rates', () => {
    const handler = new CoberturaCoverageHandler();

    // Empty lines triggers the `totalLines > 0` false branch in processFile
    // and the zero-guard branches in finalize (package and global line-rate)
    handler.processFile('pkg/empty.cls', 'EmptyFile', {});
    const result = handler.finalize();

    const pkg = result.coverage.packages.package[0];
    expect(pkg['@name']).toBe('pkg');
    const cls = pkg.classes.class[0];
    expect(cls['@filename']).toBe('pkg/empty.cls');
    expect(cls['@line-rate']).toBe(0);
    expect(cls.lines.line).toEqual([]);
    // Package and global rates must be 0, not NaN, when no lines are tracked
    expect(pkg['@line-rate']).toBe(0);
    expect(result.coverage['@line-rate']).toBe(0);
  });

  it('sorts packages and classes within each package by name', () => {
    const handler = new CoberturaCoverageHandler();

    handler.processFile('zeta/fileB.cls', 'FileB', { '1': 1 });
    handler.processFile('zeta/fileA.cls', 'FileA', { '1': 1 });
    handler.processFile('alpha/fileC.cls', 'FileC', { '1': 1 });

    const result = handler.finalize();

    expect(result.coverage.packages.package.map((p) => p['@name'])).toEqual(['alpha', 'zeta']);
    const zeta = result.coverage.packages.package[1];
    expect(zeta.classes.class.map((c) => c['@filename'])).toEqual(['zeta/fileA.cls', 'zeta/fileB.cls']);
  });
});
