'use strict';

import { describe, it, expect } from 'vitest';

import { IstanbulCoverageHandler } from '../../src/handlers/istanbulJson.js';

describe('IstanbulCoverageHandler unit tests', () => {
  it('sets path to filePath argument', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('force-app/classes/Foo.cls', 'Foo', { '1': 1 });
    const result = handler.finalize();
    expect(result['force-app/classes/Foo.cls'].path).toBe('force-app/classes/Foo.cls');
  });

  it('builds statementMap with correct start/end line and column=0', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '5': 1, '10': 0 });
    const result = handler.finalize();
    const stmtMap = result['src/A.cls'].statementMap;
    expect(stmtMap['5']).toEqual({ start: { line: 5, column: 0 }, end: { line: 5, column: 0 } });
    expect(stmtMap['10']).toEqual({ start: { line: 10, column: 0 }, end: { line: 10, column: 0 } });
  });

  it('populates s (statement hits) with the raw hit count', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0 });
    const result = handler.finalize();
    expect(result['src/A.cls'].s['1']).toBe(1);
    expect(result['src/A.cls'].s['2']).toBe(0);
  });

  it('populates l (line coverage) with the raw hit count', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '3': 1, '7': 0 });
    const result = handler.finalize();
    expect(result['src/A.cls'].l['3']).toBe(1);
    expect(result['src/A.cls'].l['7']).toBe(0);
  });

  it('fnMap, f, branchMap, b are empty objects', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    const file = result['src/A.cls'];
    expect(file.fnMap).toEqual({});
    expect(file.f).toEqual({});
    expect(file.branchMap).toEqual({});
    expect(file.b).toEqual({});
  });

  it('sorts output by file path in finalize', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('z/Last.cls', 'Last', { '1': 1 });
    handler.processFile('a/First.cls', 'First', { '1': 1 });
    handler.processFile('m/Middle.cls', 'Middle', { '1': 1 });
    const result = handler.finalize();
    const keys = Object.keys(result);
    expect(keys[0]).toBe('a/First.cls');
    expect(keys[1]).toBe('m/Middle.cls');
    expect(keys[2]).toBe('z/Last.cls');
  });

  it('start and end line are both the same line number', () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '42': 1 });
    const result = handler.finalize();
    const stmtEntry = result['src/A.cls'].statementMap['42'];
    expect(stmtEntry.start.line).toBe(42);
    expect(stmtEntry.end.line).toBe(42);
  });
});
