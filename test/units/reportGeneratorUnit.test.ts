'use strict';

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

import { generateAndWriteReport, getExtensionForFormat } from '../../src/transformers/reportGenerator.js';
import { LcovCoverageHandler } from '../../src/handlers/lcov.js';
import { SonarCoverageHandler } from '../../src/handlers/sonar.js';
import { IstanbulCoverageHandler } from '../../src/handlers/istanbulJson.js';
import { CoberturaCoverageHandler } from '../../src/handlers/cobertura.js';

// Ensure all handlers are registered
import '../../src/handlers/getHandler.js';

describe('reportGenerator unit tests', () => {
  it('produces correct LCOV format (TN:, SF:, DA:, LF:, LH:, BRF:, BRH:, end_of_record)', async () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0, '3': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'lcov-report-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.info'), coverageObj, 'lcovonly', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('TN:');
      expect(content).toContain('SF:src/A.cls');
      expect(content).toContain('DA:1,1');
      expect(content).toContain('DA:2,0');
      expect(content).toContain('DA:3,1');
      expect(content).toContain('LF:3');
      expect(content).toContain('LH:2');
      expect(content).toContain('FNF:0');
      expect(content).toContain('FNH:0');
      expect(content).toContain('BRF:0');
      expect(content).toContain('BRH:0');
      expect(content).toContain('end_of_record');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('uses no suffix in filename when formatAmount is 1', async () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'single-format-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'sonar', 1);
      expect(outPath).toContain('coverage.xml');
      expect(outPath).not.toContain('-sonar');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('appends -format suffix in filename when formatAmount > 1', async () => {
    const handler = new SonarCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'multi-format-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'sonar', 3);
      expect(outPath).toContain('-sonar');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('produces valid JSON for the "json" format', async () => {
    const handler = new IstanbulCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'json-format-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.json'), coverageObj, 'json', 1);
      const content = await readFile(outPath, 'utf-8');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = JSON.parse(content);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(parsed['src/A.cls']).toBeDefined();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('produces XML with DOCTYPE for cobertura format', async () => {
    const handler = new CoberturaCoverageHandler();
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'cobertura-hdr-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'cobertura', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('<?xml version="1.0" ?>');
      expect(content).toContain('<!DOCTYPE coverage');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('produces XML without DOCTYPE for sonar format', async () => {
    const handler = new SonarCoverageHandler();
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'sonar-hdr-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'sonar', 1);
      const content = await readFile(outPath, 'utf-8');
      expect(content).toContain('<?xml version="1.0"?>');
      expect(content).not.toContain('<!DOCTYPE');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('getExtensionForFormat returns correct extension', () => {
    expect(getExtensionForFormat('sonar')).toBe('.xml');
    expect(getExtensionForFormat('json')).toBe('.json');
    expect(getExtensionForFormat('lcovonly')).toBe('.info');
    expect(getExtensionForFormat('html')).toBe('.html');
    expect(getExtensionForFormat('markdown')).toBe('.md');
    expect(getExtensionForFormat('github-actions')).toBe('.txt');
    expect(getExtensionForFormat('unknown-xyz')).toBe('.xml');
  });

  it('LCOV output for multiple files is separated by newline', async () => {
    const handler = new LcovCoverageHandler();
    handler.processFile('a/A.cls', 'A', { '1': 1 });
    handler.processFile('b/B.cls', 'B', { '2': 0 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'lcov-multi-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.info'), coverageObj, 'lcovonly', 1);
      const content = await readFile(outPath, 'utf-8');
      const endRecords = (content.match(/end_of_record/g) ?? []).length;
      expect(endRecords).toBe(2);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
