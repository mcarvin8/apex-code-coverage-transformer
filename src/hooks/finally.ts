'use strict';

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Hook } from '@oclif/core';

import TransformerTransform from '../commands/acc-transformer/transform.js';
import { getRepoRoot } from '../utils/getRepoRoot.js';
import { HookFile } from '../utils/types.js';

function buildCommandArgs(coverageJsonPath: string, outputReportPath: string, configFile: HookFile): string[] {
  const args: string[] = ['--coverage-json', coverageJsonPath, '--output-report', outputReportPath];

  const coverageFormat = configFile.format || 'sonar';
  if (coverageFormat.trim() !== '') {
    for (const format of coverageFormat.split(',')) {
      args.push('--format', format.replace(/,/g, ''));
    }
  }

  const ignorePackageDirs = configFile.ignorePackageDirectories || '';
  if (ignorePackageDirs.trim() !== '') {
    for (const dir of ignorePackageDirs.split(',')) {
      args.push('--ignore-package-directory', dir.replace(/,/g, ''));
    }
  }

  if (configFile.minCoverage !== undefined) {
    args.push('--min-coverage', String(configFile.minCoverage));
  }

  if (configFile.maxAnnotations !== undefined) {
    args.push('--max-annotations', String(configFile.maxAnnotations));
  }

  const excludePatterns = configFile.excludePatterns ?? '';
  if (excludePatterns.trim() !== '') {
    for (const pattern of excludePatterns.split(',')) {
      args.push('--exclude-pattern', pattern.trim());
    }
  }

  return args;
}

export const hook: Hook<'finally'> = async function (options) {
  const commandId = options?.Command?.id ?? '';
  let commandType: string;
  if (
    [
      'project:deploy:validate',
      'project:deploy:start',
      'project:deploy:report',
      'project:deploy:resume',
      'hardis:project:deploy:smart',
    ].includes(commandId)
  ) {
    commandType = 'deploy';
  } else if (['apex:run:test', 'apex:get:test', 'hardis:org:test:apex'].includes(commandId)) {
    commandType = 'test';
  } else {
    return;
  }

  const { repoRoot } = await getRepoRoot();
  if (!repoRoot) {
    return;
  }

  let configFile: HookFile;
  const configPath = resolve(repoRoot, '.apexcodecovtransformer.config.json');
  try {
    const jsonString: string = await readFile(configPath, 'utf-8');
    configFile = JSON.parse(jsonString) as HookFile;
  } catch {
    return;
  }

  const outputReport = configFile.outputReportPath || 'coverage.xml';
  const coverageJson =
    commandType === 'deploy' ? configFile.deployCoverageJsonPath || '.' : configFile.testCoverageJsonPath || '.';

  if (coverageJson.trim() === '.') {
    return;
  }

  const coverageJsonPath = resolve(coverageJson);
  if (!existsSync(coverageJsonPath)) {
    return;
  }

  const commandArgs = buildCommandArgs(coverageJsonPath, resolve(outputReport), configFile);
  await TransformerTransform.run(commandArgs);
};
