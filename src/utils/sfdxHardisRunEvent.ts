'use strict';

import { resolve } from 'node:path';
import type {
  PluginPullRequestCommentRequest,
  PluginPullRequestCommentResult,
  SfdxHardisRunEvent,
} from 'sfdx-hardis/plugin-api';

import { transformCoverage } from '../transformers/coverageTransformer.js';
import { getHookTransformOptions, loadHookConfig } from './hookConfig.js';
import { TransformCoverageResult } from './types.js';

export const PLUGIN_NAME = 'apex-code-coverage-transformer';
export const PULL_REQUEST_COMMENT_TITLE = 'Apex code coverage';

/** GitHub rejects comments over 65536 characters; keep room for the sfdx-hardis wrapper. */
export const MAX_COMMENT_LENGTH = 60_000;

/** One Pull Request comment per kind of run; the next run of the same kind updates it. */
export function getCommentKey(event: Pick<SfdxHardisRunEvent, 'event' | 'data'>): string {
  if (event.event === 'sfdx-hardis:apex-tests-done') return 'apex-tests';
  return event.data.checkOnly ? 'validation' : 'deployment';
}

/** Build the comment body from the markdown report, with the minimum coverage verdict on top. */
export function buildCommentMarkdown(
  markdownReport: string,
  result: TransformCoverageResult,
  minCoverage?: number,
): string {
  // sfdx-hardis renders the comment title, so drop the report's own H1.
  const report = markdownReport.replace(/^# .*\n+/, '').trim();
  const percent = (result.summary.lineRate * 100).toFixed(2);
  const lines: string[] = [];
  if (minCoverage !== undefined) {
    lines.push(
      result.passed
        ? `✅ Coverage of ${percent}% meets the minimum of ${minCoverage}%.`
        : `❌ Coverage of ${percent}% is below the minimum of ${minCoverage}%.`,
      '',
    );
  }
  lines.push(report, '');
  lines.push(
    "_Only Apex in this repository's package directories is counted, so this can differ from the org-wide coverage reported by sfdx-hardis._",
  );
  return truncateMarkdown(lines.join('\n'), MAX_COMMENT_LENGTH);
}

/** Cut at the last full line under the limit, with a note pointing to the full reports. */
export function truncateMarkdown(markdown: string, maxLength: number): string {
  if (markdown.length <= maxLength) return markdown;
  const note = '\n\n_Truncated: see the coverage reports of the job for every file._';
  const cut = markdown.lastIndexOf('\n', maxLength - note.length);
  return `${markdown.slice(0, cut > 0 ? cut : maxLength - note.length)}${note}`;
}

export type SfdxHardisRunEventDeps = {
  postPullRequestComment: (request: PluginPullRequestCommentRequest) => Promise<PluginPullRequestCommentResult>;
  log: (message: string) => void;
  warn: (message: string) => void;
  /** Directory to search upward from for `sfdx-project.json`. Defaults to `process.cwd()`. */
  cwd?: string;
};

export type SfdxHardisRunEventOutcome =
  | { handled: false; reason: 'no-coverage-file' | 'no-config' }
  | {
      handled: true;
      reportPaths: string[];
      passed: boolean;
      comment: PluginPullRequestCommentResult | { posted: false; reason: 'disabled' };
    };

/**
 * Transform the coverage file sent by an sfdx-hardis run event into the reports set in
 * `.apexcodecovtransformer.config.json`, then post the coverage summary as a Pull Request comment.
 */
export async function handleSfdxHardisRunEvent(
  event: Pick<SfdxHardisRunEvent, 'event' | 'data'>,
  deps: SfdxHardisRunEventDeps,
): Promise<SfdxHardisRunEventOutcome> {
  const { coverageFile } = event.data;
  if (!coverageFile) return { handled: false, reason: 'no-coverage-file' };

  const loaded = await loadHookConfig(deps.cwd);
  if (!loaded) return { handled: false, reason: 'no-config' };

  const options = getHookTransformOptions(loaded.config);
  const base = {
    inputs: [coverageFile],
    cwd: deps.cwd,
    ignorePackageDirectories: options.ignorePackageDirectories,
    excludePatterns: options.excludePatterns,
    minCoverage: options.minCoverage,
    maxAnnotations: options.maxAnnotations,
  };

  const result = await transformCoverage({
    ...base,
    formats: options.formats,
    outputReport: resolve(deps.cwd ?? process.cwd(), options.outputReport),
  });
  const reportPaths = result.reports.map((report) => report.path as string);
  deps.log(`The coverage report has been written to: ${reportPaths.join(', ')}`);
  for (const warning of result.warnings) deps.warn(warning);

  if (loaded.config.pullRequestComment === false) {
    return { handled: true, reportPaths, passed: result.passed, comment: { posted: false, reason: 'disabled' } };
  }

  const markdownReport =
    result.reports.find((report) => report.format === 'markdown')?.content ??
    (await transformCoverage({ ...base, formats: ['markdown'], write: false })).reports[0].content;

  const comment = await deps.postPullRequestComment({
    pluginName: PLUGIN_NAME,
    messageKey: getCommentKey(event),
    title: PULL_REQUEST_COMMENT_TITLE,
    markdown: buildCommentMarkdown(markdownReport, result, options.minCoverage),
    status: result.passed ? 'valid' : 'invalid',
  });

  return { handled: true, reportPaths, passed: result.passed, comment };
}
