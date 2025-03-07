'use strict';

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Hook } from '@oclif/core';

import TransformerTransform from '../commands/acc-transformer/transform.js';
import { HookFile } from '../helpers/types.js';
import { getRepoRoot } from '../helpers/getRepoRoot.js';

export const postrun: Hook<'postrun'> = async function (options) {
  let commandType: string;
  let coverageJson: string;
  if (
    [
      'project:deploy:validate',
      'project:deploy:start',
      'project:deploy:report',
      'project:deploy:resume',
      'hardis:project:deploy:smart',
    ].includes(options.Command.id)
  ) {
    commandType = 'deploy';
  } else if (['apex:run:test', 'apex:get:test', 'hardis:org:test:apex'].includes(options.Command.id)) {
    commandType = 'test';
  } else {
    return;
  }
  let configFile: HookFile;
  const { repoRoot } = await getRepoRoot();
  if (!repoRoot) {
    return;
  }
  const configPath = resolve(repoRoot, '.apexcodecovtransformer.config.json');

  try {
    const jsonString: string = await readFile(configPath, 'utf-8');
    configFile = JSON.parse(jsonString) as HookFile;
  } catch (error) {
    return;
  }

  const outputReport: string = configFile.outputReportPath || 'coverage.xml';
  const coverageFormat: string = configFile.format || 'sonar';
  const ignorePackageDirs: string = configFile.ignorePackageDirectories || '';

  if (commandType === 'deploy') {
    coverageJson = configFile.deployCoverageJsonPath || '.';
  } else {
    coverageJson = configFile.testCoverageJsonPath || '.';
  }

  if (coverageJson.trim() === '.') {
    return;
  }

  const coverageJsonPath = resolve(coverageJson);
  const outputReportPath = resolve(outputReport);

  if (!existsSync(coverageJsonPath)) {
    return;
  }

  const commandArgs: string[] = [];
  commandArgs.push('--coverage-json');
  commandArgs.push(coverageJsonPath);
  commandArgs.push('--output-report');
  commandArgs.push(outputReportPath);
  commandArgs.push('--format');
  commandArgs.push(coverageFormat);
  if (ignorePackageDirs.trim() !== '') {
    const ignorePackageDirArray: string[] = ignorePackageDirs.split(',');
    for (const dirs of ignorePackageDirArray) {
      const sanitizedDir = dirs.replace(/,/g, '');
      commandArgs.push('--ignore-package-directory');
      commandArgs.push(sanitizedDir);
    }
  }
  await TransformerTransform.run(commandArgs);
};
