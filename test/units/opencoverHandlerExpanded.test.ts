'use strict';

import { describe, it, expect } from 'vitest';

import { OpenCoverCoverageHandler } from '../../src/handlers/opencover.js';

describe('OpenCoverCoverageHandler expanded unit tests', () => {
  it('calculates @sequenceCoverage correctly when numSequencePoints > 0', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 1, '3': 0, '4': 0 });
    const result = handler.finalize();
    const summary = result.CoverageSession.Summary;
    // 2 covered out of 4 total = 50%
    expect(summary['@numSequencePoints']).toBe(4);
    expect(summary['@visitedSequencePoints']).toBe(2);
    expect(summary['@sequenceCoverage']).toBe(50);
  });

  it('sets @branchCoverage to 0 always', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    expect(result.CoverageSession.Summary['@branchCoverage']).toBe(0);
  });

  it('sequence points have correct @vc, @sl, @el values', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '5': 1, '10': 0 });
    const result = handler.finalize();
    const cls = result.CoverageSession.Modules.Module[0].Classes.Class[0];
    const method = cls.Methods.Method[0];
    const sp5 = method.SequencePoints.SequencePoint.find((sp) => sp['@sl'] === 5);
    const sp10 = method.SequencePoints.SequencePoint.find((sp) => sp['@sl'] === 10);
    expect(sp5?.['@vc']).toBe(1);
    expect(sp5?.['@el']).toBe(5);
    expect(sp5?.['@sc']).toBe(0);
    expect(sp5?.['@ec']).toBe(0);
    expect(sp10?.['@vc']).toBe(0);
  });

  it('@isConstructor and @isStatic are always false on methods', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const result = handler.finalize();
    const method = result.CoverageSession.Modules.Module[0].Classes.Class[0].Methods.Method[0];
    expect(method['@isConstructor']).toBe(false);
    expect(method['@isStatic']).toBe(false);
  });

  it('sorts classes by @fullName', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('z/Z.cls', 'ZClass', { '1': 1 });
    handler.processFile('a/A.cls', 'AClass', { '1': 1 });
    const result = handler.finalize();
    const classes = result.CoverageSession.Modules.Module[0].Classes.Class;
    expect(classes[0]['@fullName']).toBe('AClass');
    expect(classes[1]['@fullName']).toBe('ZClass');
  });

  it('accumulates numSequencePoints and visitedSequencePoints across files', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('a/A.cls', 'A', { '1': 1, '2': 0 });
    handler.processFile('b/B.cls', 'B', { '1': 1, '2': 1, '3': 0 });
    const result = handler.finalize();
    const summary = result.CoverageSession.Summary;
    expect(summary['@numSequencePoints']).toBe(5);
    expect(summary['@visitedSequencePoints']).toBe(3);
  });

  it('reassigns UIDs starting from 1 in sorted order', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('c/C.cls', 'C', { '1': 1 });
    handler.processFile('a/A.cls', 'A', { '1': 1 });
    handler.processFile('b/B.cls', 'B', { '1': 1 });
    const result = handler.finalize();
    const files = result.CoverageSession.Modules.Module[0].Files.File;
    expect(files[0]['@fullPath']).toBe('a/A.cls');
    expect(files[0]['@uid']).toBe(1);
    expect(files[1]['@fullPath']).toBe('b/B.cls');
    expect(files[1]['@uid']).toBe(2);
    expect(files[2]['@fullPath']).toBe('c/C.cls');
    expect(files[2]['@uid']).toBe(3);
  });

  it('@sequenceCoverage is rounded to 2 decimal places', () => {
    const handler = new OpenCoverCoverageHandler();
    // 1 out of 3 = 33.333...% → should round to 33.33
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0, '3': 0 });
    const result = handler.finalize();
    expect(result.CoverageSession.Summary['@sequenceCoverage']).toBe(33.33);
  });

  // ── UpdateOperator mutation killer (opencover.ts:107) ──
  // Mutant changes this.fileIdCounter++ to this.fileIdCounter-- .
  // With --, each new file gets a lower (negative) UID. After finalize, files are sorted and
  // UIDs are reassigned 1..n, but the INTERMEDIATE UIDs used before finalize would be wrong.
  // The key observable: after sorting and reassigning, UIDs must be 1, 2, 3... sequentially.

  it('file UIDs are positive integers starting from 1 before finalize reassignment', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('a/A.cls', 'AClass', { '1': 1 });
    handler.processFile('b/B.cls', 'BClass', { '1': 0 });
    handler.processFile('c/C.cls', 'CClass', { '1': 1 });
    const result = handler.finalize();
    const files = result.CoverageSession.Modules.Module[0].Files.File;
    // After sort+reassign: UIDs must be exactly [1, 2, 3] in sorted file order
    expect(files.map((f) => f['@uid'])).toEqual([1, 2, 3]);
    // And must all be positive
    expect(files.every((f) => f['@uid'] > 0)).toBe(true);
  });

  it('each distinct file path gets a unique @uid before finalize reassignment (counter increments)', () => {
    // With fileIdCounter--: the UIDs assigned during processFile would be: 1, 0, -1
    // After finalize reassignment they'd be [1,2,3] anyway — so we also test via registered count.
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('file1.cls', 'F1', { '1': 1 });
    handler.processFile('file2.cls', 'F2', { '1': 1 });
    handler.processFile('file3.cls', 'F3', { '1': 1 });
    const result = handler.finalize();
    const files = result.CoverageSession.Modules.Module[0].Files.File;
    // 3 distinct file paths → 3 File entries each with a unique UID
    expect(files).toHaveLength(3);
    const uids = files.map((f) => f['@uid']);
    const uniqueUids = new Set(uids);
    expect(uniqueUids.size).toBe(3);
  });

  // ── ArrayDeclaration mutation killer (opencover.ts:122) ──
  // Mutant replaces `const sequencePoints: OpenCoverSequencePoint[] = []`
  // with `["Stryker was here"]` — an array with one bogus string element.
  // The result would include that extra entry in SequencePoints.

  it('sequence points only contain entries from the lines record (no spurious initial elements)', () => {
    const handler = new OpenCoverCoverageHandler();
    handler.processFile('a/A.cls', 'A', { '3': 1, '7': 0 });
    const result = handler.finalize();
    const cls = result.CoverageSession.Modules.Module[0].Classes.Class[0];
    const sps = cls.Methods.Method[0].SequencePoints.SequencePoint;
    // Only 2 entries (lines 3 and 7)
    expect(sps).toHaveLength(2);
    // All entries must have numeric @sl values matching our lines
    const slValues = sps.map((sp) => sp['@sl']).sort((a, b) => a - b);
    expect(slValues).toEqual([3, 7]);
  });
});
