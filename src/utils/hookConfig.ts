'use strict';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getRepoRoot } from './getRepoRoot.js';
import { CoverageFormat, HookFile } from './types.js';

export const HOOK_CONFIG_FILE_NAME = '.apexcodecovtransformer.config.json';

/**
 * Set by the prerun hook while an sfdx-hardis command runs. sfdx-hardis passes its environment to the
 * `sf` commands it starts (`sf project deploy start`, `sf apex run test`...), so the `finally` hook of
 * those child commands can leave the coverage to the sfdx-hardis events instead of running twice.
 */
export const SFDX_HARDIS_PARENT_ENV = 'APEX_CODE_COVERAGE_TRANSFORMER_IN_SFDX_HARDIS';

export function markSfdxHardisParent(commandId: string, env: NodeJS.ProcessEnv = process.env): void {
  if (commandId.startsWith('hardis:')) env[SFDX_HARDIS_PARENT_ENV] = 'true';
}

export function isRunningUnderSfdxHardis(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[SFDX_HARDIS_PARENT_ENV] === 'true';
}

/** Options shared by every hook, parsed from the comma-separated values of the config file. */
export type HookTransformOptions = {
  outputReport: string;
  formats: CoverageFormat[];
  ignorePackageDirectories: string[];
  excludePatterns: string[];
  minCoverage?: number;
  maxAnnotations?: number;
};

/** Split a comma-separated config value into trimmed, non-empty entries. */
export function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

/**
 * Load `.apexcodecovtransformer.config.json` from the root of the Salesforce DX project.
 * Returns undefined when there is no project or no readable config: the hooks are opt-in.
 */
export async function loadHookConfig(cwd?: string): Promise<{ repoRoot: string; config: HookFile } | undefined> {
  let repoRoot: string;
  try {
    // getRepoRoot throws when no sfdx-project.json is found, so repoRoot is always set here.
    repoRoot = (await getRepoRoot(cwd)).repoRoot as string;
  } catch {
    return undefined;
  }

  try {
    const config = JSON.parse(await readFile(resolve(repoRoot, HOOK_CONFIG_FILE_NAME), 'utf-8')) as HookFile;
    return { repoRoot, config };
  } catch {
    return undefined;
  }
}

export function getHookTransformOptions(config: HookFile): HookTransformOptions {
  const formats = splitList(config.format);
  return {
    outputReport: config.outputReportPath || 'coverage.xml',
    formats: (formats.length > 0 ? formats : ['sonar']) as CoverageFormat[],
    ignorePackageDirectories: splitList(config.ignorePackageDirectories),
    excludePatterns: splitList(config.excludePatterns),
    minCoverage: config.minCoverage,
    maxAnnotations: config.maxAnnotations,
  };
}
