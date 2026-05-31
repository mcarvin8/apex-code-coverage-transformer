'use strict';

import { describe, it, expect } from 'vitest';

import { JaCoCoCoverageHandler } from '../../src/handlers/jacoco.js';

describe('JaCoCoCoverageHandler unit tests', () => {
  it('sets @mi=0, @ci=1 for covered lines', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '5': 1 });
    const result = handler.finalize();
    const pkg = result.report.package[0];
    const sf = pkg.sourcefile[0];
    const line = sf.line.find((l) => l['@nr'] === 5);
    expect(line?.['@mi']).toBe(0);
    expect(line?.['@ci']).toBe(1);
  });

  it('sets @mi=1, @ci=0 for uncovered lines', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '3': 0 });
    const result = handler.finalize();
    const pkg = result.report.package[0];
    const sf = pkg.sourcefile[0];
    const line = sf.line.find((l) => l['@nr'] === 3);
    expect(line?.['@mi']).toBe(1);
    expect(line?.['@ci']).toBe(0);
  });

  it('always sets @mb=0 and @cb=0', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    const sf = result.report.package[0].sourcefile[0];
    expect(sf.line.every((l) => l['@mb'] === 0)).toBe(true);
    expect(sf.line.every((l) => l['@cb'] === 0)).toBe(true);
  });

  it('records correct @nr (line number) for each line', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '10': 1, '20': 0 });
    const result = handler.finalize();
    const nums = result.report.package[0].sourcefile[0].line.map((l) => l['@nr']);
    expect(nums).toContain(10);
    expect(nums).toContain(20);
  });

  it('source file counter @missed and @covered are correct', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '1': 1, '2': 0, '3': 1, '4': 0, '5': 1 });
    const result = handler.finalize();
    const sfCounter = result.report.package[0].sourcefile[0].counter[0];
    expect(sfCounter['@type']).toBe('LINE');
    expect(sfCounter['@covered']).toBe(3);
    expect(sfCounter['@missed']).toBe(2);
  });

  it('package counter accumulates across source files', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '1': 1, '2': 0 });
    handler.processFile('force-app/classes/B.cls', 'B', { '1': 1, '2': 1 });
    const result = handler.finalize();
    const pkgCounter = result.report.package[0].counter[0];
    expect(pkgCounter['@covered']).toBe(3);
    expect(pkgCounter['@missed']).toBe(1);
  });

  it('global counter accumulates across packages', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/A.cls', 'A', { '1': 1 });
    handler.processFile('packaged/triggers/B.trigger', 'B', { '1': 0 });
    const result = handler.finalize();
    const globalCounter = result.report.counter[0];
    expect(globalCounter['@covered']).toBe(1);
    expect(globalCounter['@missed']).toBe(1);
  });

  it('sorts packages by name', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('z-pkg/classes/A.cls', 'A', { '1': 1 });
    handler.processFile('a-pkg/classes/B.cls', 'B', { '1': 1 });
    const result = handler.finalize();
    expect(result.report.package[0]['@name']).toBe('a-pkg/classes');
    expect(result.report.package[1]['@name']).toBe('z-pkg/classes');
  });

  it('sorts source files within a package by name', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/classes/Z.cls', 'Z', { '1': 1 });
    handler.processFile('force-app/classes/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    const names = result.report.package[0].sourcefile.map((sf) => sf['@name']);
    expect(names[0]).toBe('A.cls');
    expect(names[1]).toBe('Z.cls');
  });

  it('uses only the filename (not full path) as source file @name', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/main/default/classes/Foo.cls', 'Foo', { '1': 1 });
    const result = handler.finalize();
    expect(result.report.package[0].sourcefile[0]['@name']).toBe('Foo.cls');
  });

  it('package @name is the path excluding the filename', () => {
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('force-app/main/default/classes/Foo.cls', 'Foo', { '1': 1 });
    const result = handler.finalize();
    expect(result.report.package[0]['@name']).toBe('force-app/main/default/classes');
  });

  it('report @name is "JaCoCo"', () => {
    const handler = new JaCoCoCoverageHandler();
    const result = handler.finalize();
    expect(result.report['@name']).toBe('JaCoCo');
  });
});
