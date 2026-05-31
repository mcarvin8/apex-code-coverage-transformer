'use strict';

import { describe, it, expect } from 'vitest';

import { JsonSummaryCoverageHandler } from '../../src/handlers/jsonSummary.js';

describe('JsonSummaryCoverageHandler expanded unit tests', () => {
  it('sorts file entries by path in finalize', () => {
    const handler = new JsonSummaryCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 1 });
    handler.processFile('a/First.cls', 'First', { '1': 1 });
    handler.processFile('m/Middle.cls', 'Middle', { '1': 1 });
    const result = handler.finalize();
    const keys = Object.keys(result.files);
    expect(keys[0]).toBe('a/First.cls');
    expect(keys[1]).toBe('m/Middle.cls');
    expect(keys[2]).toBe('z/Last.cls');
  });

  it('accumulates total lines across multiple files', () => {
    const handler = new JsonSummaryCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0 });
    handler.processFile('b.cls', 'B', { '1': 1, '2': 1, '3': 0 });
    const result = handler.finalize();
    expect(result.total.lines.total).toBe(5);
    expect(result.total.lines.covered).toBe(3);
  });

  it('sets total pct to 0 when no lines', () => {
    const handler = new JsonSummaryCoverageHandler();
    const result = handler.finalize();
    expect(result.total.lines.pct).toBe(0);
    expect(result.total.lines.total).toBe(0);
  });

  it('statements mirror lines values', () => {
    const handler = new JsonSummaryCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0, '3': 1 });
    const result = handler.finalize();
    expect(result.total.statements.total).toBe(result.total.lines.total);
    expect(result.total.statements.covered).toBe(result.total.lines.covered);
    expect(result.total.statements.pct).toBe(result.total.lines.pct);
  });

  it('file-level statements mirror file-level lines', () => {
    const handler = new JsonSummaryCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    const file = result.files['a.cls'];
    expect(file.statements.total).toBe(file.lines.total);
    expect(file.statements.covered).toBe(file.lines.covered);
    expect(file.statements.pct).toBe(file.lines.pct);
  });

  it('skipped is always 0', () => {
    const handler = new JsonSummaryCoverageHandler();
    handler.processFile('a.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    expect(result.total.lines.skipped).toBe(0);
    expect(result.files['a.cls'].lines.skipped).toBe(0);
  });
});
