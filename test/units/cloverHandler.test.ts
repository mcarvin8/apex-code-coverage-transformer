'use strict';

import { describe, it, expect } from 'vitest';

import { CloverCoverageHandler } from '../../src/handlers/clover.js';

describe('CloverCoverageHandler unit tests', () => {
  it('sets @count=1 for covered lines and @count=0 for uncovered', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '1': 1, '2': 0 });
    const result = handler.finalize();
    const lines = result.coverage.project.file[0].line;
    const line1 = lines.find((l) => l['@num'] === 1);
    const line2 = lines.find((l) => l['@num'] === 2);
    expect(line1?.['@count']).toBe(1);
    expect(line2?.['@count']).toBe(0);
  });

  it('sets @type to "stmt" for every line', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '1': 1, '2': 0, '3': 1 });
    const result = handler.finalize();
    const lines = result.coverage.project.file[0].line;
    expect(lines.every((l) => l['@type'] === 'stmt')).toBe(true);
  });

  it('records correct @num for each line', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '5': 1, '10': 0 });
    const result = handler.finalize();
    const nums = result.coverage.project.file[0].line.map((l) => l['@num']);
    expect(nums).toContain(5);
    expect(nums).toContain(10);
  });

  it('accumulates @statements, @coveredstatements in project metrics', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0, '3': 1 });
    handler.processFile('b.cls', 'B', { '1': 1, '2': 1 });
    const result = handler.finalize();
    const m = result.coverage.project.metrics;
    expect(m['@statements']).toBe(5);
    expect(m['@coveredstatements']).toBe(4);
  });

  it('accumulates @elements, @coveredelements in project metrics', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    const m = result.coverage.project.metrics;
    expect(m['@elements']).toBe(2);
    expect(m['@coveredelements']).toBe(1);
  });

  it('increments @files and @classes per processed file', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1 });
    handler.processFile('b.cls', 'B', { '1': 1 });
    const result = handler.finalize();
    const m = result.coverage.project.metrics;
    expect(m['@files']).toBe(2);
    expect(m['@classes']).toBe(2);
  });

  it('accumulates @loc and @ncloc equal to total lines', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0, '3': 1 });
    const result = handler.finalize();
    const m = result.coverage.project.metrics;
    expect(m['@loc']).toBe(3);
    expect(m['@ncloc']).toBe(3);
  });

  it('keeps @conditionals and @coveredconditionals at 0', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage.project.metrics['@conditionals']).toBe(0);
    expect(result.coverage.project.metrics['@coveredconditionals']).toBe(0);
  });

  it('sorts files by @path in finalize', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 1 });
    handler.processFile('a/First.cls', 'First', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage.project.file[0]['@path']).toBe('a/First.cls');
    expect(result.coverage.project.file[1]['@path']).toBe('z/Last.cls');
  });

  it('sets @name on each file object', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '1': 1 });
    const result = handler.finalize();
    expect(result.coverage.project.file[0]['@name']).toBe('Foo');
  });

  it('handles empty lines object without crashing', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('empty.cls', 'Empty', {});
    const result = handler.finalize();
    expect(result.coverage.project.file[0].line).toEqual([]);
    expect(result.coverage.project.metrics['@statements']).toBe(0);
  });

  it('project @name is "All files"', () => {
    const handler = new CloverCoverageHandler();
    const result = handler.finalize();
    expect(result.coverage.project['@name']).toBe('All files');
  });

  it('file-level metrics reflect the file line counts', () => {
    const handler = new CloverCoverageHandler();
    handler.processFile('src/Foo.cls', 'Foo', { '1': 1, '2': 0, '3': 1 });
    const result = handler.finalize();
    const m = result.coverage.project.file[0].metrics;
    expect(m['@statements']).toBe(3);
    expect(m['@coveredstatements']).toBe(2);
  });
});
