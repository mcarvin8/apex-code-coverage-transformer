'use strict';

import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SfdxHardisRunEvent } from 'sfdx-hardis/plugin-api';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { HOOK_CONFIG_FILE_NAME } from '../../src/utils/hookConfig.js';
import {
  buildCommentMarkdown,
  getCommentKey,
  handleSfdxHardisRunEvent,
  PLUGIN_NAME,
  PULL_REQUEST_COMMENT_TITLE,
  type SfdxHardisRunEventDeps,
  truncateMarkdown,
} from '../../src/utils/sfdxHardisRunEvent.js';
import type { HookFile, TransformCoverageResult } from '../../src/utils/types.js';
import { baselineClassPath, baselineTriggerPath, deployCoverage, testCoverage } from '../utils/testConstants.js';

type RunEvent = Pick<SfdxHardisRunEvent, 'event' | 'data'>;

function runEvent(
  overrides: Partial<SfdxHardisRunEvent['data']> = {},
  event: SfdxHardisRunEvent['event'] = 'sfdx-hardis:validation-done',
): RunEvent {
  return {
    event,
    data: { checkOnly: true, deploymentLabel: null, status: 'success', coverageFile: deployCoverage, ...overrides },
  };
}

function result(lineRate: number, passed: boolean): TransformCoverageResult {
  return {
    reports: [],
    summary: { lineRate, coveredLines: 0, totalLines: 0, fileCount: 0, files: [] },
    warnings: [],
    passed,
  };
}

let projectDir: string;
let deps: {
  postPullRequestComment: Mock<SfdxHardisRunEventDeps['postPullRequestComment']>;
  log: Mock<SfdxHardisRunEventDeps['log']>;
  warn: Mock<SfdxHardisRunEventDeps['warn']>;
  cwd: string;
};

async function writeConfig(config: HookFile): Promise<void> {
  await writeFile(join(projectDir, HOOK_CONFIG_FILE_NAME), JSON.stringify(config));
}

beforeEach(async () => {
  projectDir = await mkdtemp(join(tmpdir(), 'acc-hardis-event-'));
  await mkdir(join(projectDir, 'force-app/main/default/classes'), { recursive: true });
  await mkdir(join(projectDir, 'packaged/triggers'), { recursive: true });
  await copyFile(baselineClassPath, join(projectDir, 'force-app/main/default/classes/AccountProfile.cls'));
  await copyFile(baselineTriggerPath, join(projectDir, 'packaged/triggers/AccountTrigger.trigger'));
  await writeFile(
    join(projectDir, 'sfdx-project.json'),
    JSON.stringify({ packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }] }),
  );
  deps = {
    postPullRequestComment: vi
      .fn<SfdxHardisRunEventDeps['postPullRequestComment']>()
      .mockResolvedValue({ posted: true }),
    log: vi.fn<SfdxHardisRunEventDeps['log']>(),
    warn: vi.fn<SfdxHardisRunEventDeps['warn']>(),
    cwd: projectDir,
  };
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

describe('getCommentKey', () => {
  it('uses one comment per kind of run', () => {
    expect(getCommentKey(runEvent())).toBe('validation');
    expect(getCommentKey(runEvent({ checkOnly: false }, 'sfdx-hardis:deployment-done'))).toBe('deployment');
    expect(getCommentKey(runEvent({ checkOnly: false }, 'sfdx-hardis:apex-tests-done'))).toBe('apex-tests');
  });
});

describe('buildCommentMarkdown', () => {
  const report = '# Apex Code Coverage Report\n\n**Overall coverage:** 50.00%\n';

  it('drops the report title and adds the scope note', () => {
    const markdown = buildCommentMarkdown(report, result(0.5, true));
    expect(markdown.startsWith('**Overall coverage:** 50.00%')).toBe(true);
    expect(markdown).not.toContain('# Apex Code Coverage Report');
    expect(markdown).toContain("Only Apex in this repository's package directories is counted");
  });

  it('states whether the minimum coverage is met', () => {
    expect(buildCommentMarkdown(report, result(0.8, true), 75)).toMatch(
      /^✅ Coverage of 80\.00% meets the minimum of 75%\./,
    );
    expect(buildCommentMarkdown(report, result(0.5, false), 75)).toMatch(
      /^❌ Coverage of 50\.00% is below the minimum of 75%\./,
    );
  });
});

describe('truncateMarkdown', () => {
  it('keeps short markdown as is', () => {
    expect(truncateMarkdown('a\nb', 100)).toBe('a\nb');
  });

  it('cuts at the last full line and adds a note', () => {
    const markdown = Array.from({ length: 50 }, (_, i) => `| row ${i} |`).join('\n');
    const truncated = truncateMarkdown(markdown, 200);
    expect(truncated.length).toBeLessThanOrEqual(200);
    expect(truncated).toMatch(/\| row \d+ \|\n\n_Truncated: see the coverage reports of the job for every file\._$/);
  });

  it('cuts mid-line when there is no line break', () => {
    const truncated = truncateMarkdown('x'.repeat(300), 100);
    expect(truncated.length).toBe(100);
    expect(truncated.endsWith('every file._')).toBe(true);
  });
});

describe('handleSfdxHardisRunEvent', () => {
  it('skips when sfdx-hardis sent no coverage file', async () => {
    await writeConfig({});
    expect(await handleSfdxHardisRunEvent(runEvent({ coverageFile: null }), deps)).toEqual({
      handled: false,
      reason: 'no-coverage-file',
    });
    expect(deps.postPullRequestComment).not.toHaveBeenCalled();
  });

  it('skips when the project has no config file', async () => {
    expect(await handleSfdxHardisRunEvent(runEvent(), deps)).toEqual({ handled: false, reason: 'no-config' });
    expect(deps.postPullRequestComment).not.toHaveBeenCalled();
  });

  it('writes the configured reports and posts the markdown summary', async () => {
    await writeConfig({ format: 'sonar,cobertura', outputReportPath: 'coverage.xml', minCoverage: 90 });

    const outcome = await handleSfdxHardisRunEvent(runEvent(), deps);

    expect(outcome).toEqual({
      handled: true,
      reportPaths: [join(projectDir, 'coverage-sonar.xml'), join(projectDir, 'coverage-cobertura.xml')],
      passed: false,
      comment: { posted: true },
    });
    expect(await readFile(join(projectDir, 'coverage-sonar.xml'), 'utf-8')).toContain('<coverage');
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('coverage-sonar.xml'));
    expect(deps.postPullRequestComment).toHaveBeenCalledTimes(1);
    const request = deps.postPullRequestComment.mock.calls[0][0];
    expect(request).toMatchObject({
      pluginName: PLUGIN_NAME,
      messageKey: 'validation',
      title: PULL_REQUEST_COMMENT_TITLE,
      status: 'invalid',
    });
    expect(request.markdown).toContain('❌ Coverage of 76.32% is below the minimum of 90%.');
    expect(request.markdown).toContain('packaged/triggers/AccountTrigger.trigger');
  });

  it('reuses the markdown report when it is a configured format', async () => {
    await writeConfig({ format: 'markdown', outputReportPath: 'coverage.md' });

    const outcome = await handleSfdxHardisRunEvent(runEvent({}, 'sfdx-hardis:apex-tests-done'), deps);

    expect(outcome).toMatchObject({ handled: true, passed: true, reportPaths: [join(projectDir, 'coverage.md')] });
    const written = await readFile(join(projectDir, 'coverage.md'), 'utf-8');
    const request = deps.postPullRequestComment.mock.calls[0][0];
    expect(request.messageKey).toBe('apex-tests');
    expect(request.status).toBe('valid');
    expect(written).toContain(request.markdown.split('\n')[0]);
  });

  it('handles test run coverage', async () => {
    await writeConfig({ format: 'lcovonly', outputReportPath: 'lcov.info' });
    const outcome = await handleSfdxHardisRunEvent(
      runEvent({ checkOnly: false, coverageFile: testCoverage }, 'sfdx-hardis:apex-tests-done'),
      deps,
    );
    expect(outcome).toMatchObject({ handled: true, reportPaths: [join(projectDir, 'lcov.info')] });
  });

  it('only writes the reports when the Pull Request comment is disabled', async () => {
    await writeConfig({ pullRequestComment: false });

    const outcome = await handleSfdxHardisRunEvent(runEvent({ checkOnly: false }, 'sfdx-hardis:deployment-done'), deps);

    expect(outcome).toEqual({
      handled: true,
      reportPaths: [join(projectDir, 'coverage.xml')],
      passed: true,
      comment: { posted: false, reason: 'disabled' },
    });
    expect(deps.postPullRequestComment).not.toHaveBeenCalled();
  });

  it('forwards transformer warnings', async () => {
    await writeConfig({ excludePatterns: '**/*' });
    await handleSfdxHardisRunEvent(runEvent(), deps);
    expect(deps.warn).toHaveBeenCalledWith(expect.stringContaining('None of the files listed'));
  });
});
