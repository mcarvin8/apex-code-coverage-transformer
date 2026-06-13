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
import { JaCoCoCoverageHandler } from '../../src/handlers/jacoco.js';

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

  // ── Regex-mutation killers for prependXmlHeader and generateXmlContent ──
  // These target the survived Regex mutants in reportGenerator.ts lines 77 and 105.

  it('strips existing XML declaration before prepending the canonical one (no duplicate declaration)', async () => {
    // The sonar handler emits XML with an <?xml ...?> header. generateXmlContent must strip
    // that header before prepending the format-specific one.
    // Mutant: /^<\?xml[^>]*>\S*/i  (replaces \s* with \S*) → declaration survives if no whitespace follows ?>
    // Mutant: /<\?xml[^>]*>\s*/i (no ^ anchor) → matches anywhere, not just start
    // We verify there is EXACTLY ONE <?xml declaration in the output.
    const handler = new SonarCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'xml-dedup-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'sonar', 1);
      const content = await readFile(outPath, 'utf-8');
      const declarationCount = (content.match(/<\?xml/g) ?? []).length;
      expect(declarationCount).toBe(1);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('XML declaration is at the very start of the output (^ anchor matters)', async () => {
    // The unanchored mutant /<\?xml[^>]*>\s*/i would strip the LAST declaration if there were
    // content before it. We verify <?xml appears on line 1, position 0.
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'xml-anchor-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'cobertura', 1);
      const content = await readFile(outPath, 'utf-8');
      // The first non-empty content must be the XML declaration
      expect(content.trimStart()).toMatch(/^<\?xml/);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('strips XML declaration followed immediately by content (no whitespace between ?> and root element)', async () => {
    // Mutant \S* instead of \s*: if the XML builder produces "<?xml?>...<root>" with no space,
    // the mutant \S* would grab too much. We test that the builder output without leading spaces
    // is still handled correctly.
    // JaCoCo format is headless and its builder output starts with the XML decl directly.
    const handler = new JaCoCoCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1, '2': 0 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'xml-nospace-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'jacoco', 1);
      const content = await readFile(outPath, 'utf-8');
      // Should start with a single XML declaration
      const declarationCount = (content.match(/<\?xml/g) ?? []).length;
      expect(declarationCount).toBe(1);
      // Root element must come after the declaration
      expect(content).toContain('<report');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('prependXmlHeader strips declaration when followed by newline (singular \\s vs \\s* mutant)', async () => {
    // Mutant uses \s (singular) instead of \s* (zero-or-more). This matters when the
    // builder emits "<?xml version="1.0"?>\n<root>" — the \s singular still strips it,
    // BUT the mutant /^<\?xml[^>]*>\S*/i would fail to match because \n is not \S.
    // We test with cobertura which has the prependXmlHeader path (not headless).
    const handler = new CoberturaCoverageHandler();
    handler.processFile('pkg/A.cls', 'A', { '1': 1, '2': 1, '3': 0 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'xml-newline-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'cobertura', 1);
      const content = await readFile(outPath, 'utf-8');
      // There must be exactly one XML declaration and it must be first
      const declarationCount = (content.match(/<\?xml/g) ?? []).length;
      expect(declarationCount).toBe(1);
      expect(content.indexOf('<?xml')).toBe(0);
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('filter(Boolean) in prependXmlHeader omits undefined doctype (no empty lines)', async () => {
    // Tests reportGenerator.ts:108 — the filter(Boolean) call removes undefined config values.
    // Mutant: MethodExpression removes the filter step, leaving an array with undefined entries.
    // Sonar has no DOCTYPE — so the join should NOT produce a blank line between decl and root.
    const handler = new SonarCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'xml-filter-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'sonar', 1);
      const content = await readFile(outPath, 'utf-8');
      // The second line must not be empty/undefined (no blank line between decl and root)
      const lines = content.split('\n');
      expect(lines[1]).not.toBe('');
      expect(lines[1]).not.toBe('undefined');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });

  it('trimEnd removes trailing whitespace from XML output', async () => {
    // reportGenerator.ts:80 — the mutant replaces prependXmlHeader(...).trimEnd() with
    // prependXmlHeader(...).trimStart(). We verify the content does not end with trailing whitespace.
    const handler = new SonarCoverageHandler();
    handler.processFile('src/A.cls', 'A', { '1': 1 });
    const coverageObj = handler.finalize();

    const tmpDir = await mkdtemp(join(tmpdir(), 'xml-trim-'));
    try {
      const outPath = await generateAndWriteReport(join(tmpDir, 'coverage.xml'), coverageObj, 'sonar', 1);
      const content = await readFile(outPath, 'utf-8');
      // Output should not end with whitespace
      expect(content).toBe(content.trimEnd());
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
