/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from 'vitest';

import { OpenCoverCoverageHandler } from '../../src/handlers/opencover.js';

describe('OpenCoverCoverageHandler branch coverage', () => {
  it('keeps sequence coverage at 0 when finalize runs with no files processed', () => {
    const handler = new OpenCoverCoverageHandler();

    const result = handler.finalize();
    const summary = result.CoverageSession.Summary;

    // Covers the `@numSequencePoints > 0` false branch in finalize
    expect(summary['@numSequencePoints']).toBe(0);
    expect(summary['@visitedSequencePoints']).toBe(0);
    expect(summary['@sequenceCoverage']).toBe(0);
    expect(summary['@branchCoverage']).toBe(0);
  });

  it('does not re-register a file when processFile is called with the same filePath twice', () => {
    const handler = new OpenCoverCoverageHandler();

    handler.processFile('path/to/file.cls', 'FileName', { '1': 1, '2': 0 });
    // Calling with the same filePath exercises the `!filePathToId.has(filePath)` false branch
    handler.processFile('path/to/file.cls', 'FileName', { '3': 1 });

    const result = handler.finalize();
    const module = result.CoverageSession.Modules.Module[0];

    expect(module.Files.File).toHaveLength(1);
    expect(module.Files.File[0]['@fullPath']).toBe('path/to/file.cls');
    // Both invocations still add a Class entry even though the file is registered once
    expect(module.Classes.Class).toHaveLength(2);
    expect(module.Classes.Class.every((c) => c['@fullName'] === 'FileName')).toBe(true);
  });

  it('sorts files and reassigns uids sequentially after processing', () => {
    const handler = new OpenCoverCoverageHandler();

    handler.processFile('zeta/file.cls', 'ZetaFile', { '1': 1 });
    handler.processFile('alpha/file.cls', 'AlphaFile', { '1': 1 });

    const result = handler.finalize();
    const files = result.CoverageSession.Modules.Module[0].Files.File;

    expect(files.map((f) => f['@fullPath'])).toEqual(['alpha/file.cls', 'zeta/file.cls']);
    expect(files.map((f) => f['@uid'])).toEqual([1, 2]);
  });
});
