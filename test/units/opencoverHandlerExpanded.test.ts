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
});
