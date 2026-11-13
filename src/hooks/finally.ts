'use strict';

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Hook } from '@oclif/core';

import TransformerTransform from '../commands/acc-transformer/transform.js';
import {
  getHookTransformOptions,
  HookTransformOptions,
  isRunningUnderSfdxHardis,
  loadHookConfig,
} from '../utils/hookConfig.js';

const DEPLOY_COMMANDS = [
  'project:deploy:validate',
  'project:deploy:start',
  'project:deploy:report',
  'project:deploy:resume',
];
const TEST_COMMANDS = ['apex:run:test', 'apex:get:test'];

function buildCommandArgs(coverageJsonPath: string, options: HookTransformOptions): string[] {
  const args: string[] = ['--coverage-json', coverageJsonPath, '--output-report', resolve(options.outputReport)];
  for (const format of options.formats) args.push('--format', format);
  for (const dir of options.ignorePackageDirectories) args.push('--ignore-package-directory', dir);
  if (options.minCoverage !== undefined) args.push('--min-coverage', String(options.minCoverage));
  if (options.maxAnnotations !== undefined) args.push('--max-annotations', String(options.maxAnnotations));
  for (const pattern of options.excludePatterns) args.push('--exclude-pattern', pattern);
  return args;
}

export const hook: Hook<'finally'> = async function (options) {
  const commandId = options?.Command?.id ?? '';
  let commandType: 'deploy' | 'test';
  if (DEPLOY_COMMANDS.includes(commandId)) {
    commandType = 'deploy';
  } else if (TEST_COMMANDS.includes(commandId)) {
    commandType = 'test';
  } else {
    return;
  }

  // An sf command started by sfdx-hardis: the sfdxHardisRunDone hook handles its coverage.
  if (isRunningUnderSfdxHardis()) {
    return;
  }

  const loaded = await loadHookConfig();
  if (!loaded) {
    return;
  }
  const { config } = loaded;

  const coverageJson = (commandType === 'deploy' ? config.deployCoverageJsonPath : config.testCoverageJsonPath) || '.';
  if (coverageJson.trim() === '.') {
    return;
  }

  const coverageJsonPath = resolve(coverageJson);
  if (!existsSync(coverageJsonPath)) {
    return;
  }

  await TransformerTransform.run(buildCommandArgs(coverageJsonPath, getHookTransformOptions(config)));
};
