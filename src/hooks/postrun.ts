'use strict';

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Hook } from '@oclif/core';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import TransformerTransform from '../commands/apex-code-coverage/transformer/transform.js';
import { ConfigFile } from '../helpers/types.js';

export const postrun: Hook<'postrun'> = async function (options) {
  let commandType: string;
  if (
    ['project:deploy:validate', 'project:deploy:start', 'project:deploy:report', 'project:deploy:resume'].includes(
      options.Command.id
    )
  ) {
    commandType = 'deploy';
  } else if (['apex:run:test'].includes(options.Command.id)) {
    commandType = 'test';
  } else {
    return;
  }
  let configFile: ConfigFile;
  const gitOptions: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: true,
  };

  const git: SimpleGit = simpleGit(gitOptions);
  const repoRoot = (await git.revparse('--show-toplevel')).trim();
  const configPath = resolve(repoRoot, '.apexcodecovtransformer.config.json');

  try {
    const jsonString: string = await readFile(configPath, 'utf-8');
    configFile = JSON.parse(jsonString) as ConfigFile;
  } catch (error) {
    return;
  }

  const coverageJson: string = configFile.coverageJsonPath || '.';
  const coverageXml: string = configFile.coverageXmlPath || 'coverage.xml';

  if (coverageJson.trim() === '.') {
    return;
  }

  const coverageJsonPath = resolve(coverageJson);
  const coverageXmlPath = resolve(coverageXml);

  if (!existsSync(coverageJsonPath)) {
    return;
  }

  const commandArgs: string[] = [];
  commandArgs.push('--coverage-json');
  commandArgs.push(coverageJsonPath);
  commandArgs.push('--xml');
  commandArgs.push(coverageXmlPath);
  commandArgs.push('--command');
  commandArgs.push(commandType);
  await TransformerTransform.run(commandArgs);
};
