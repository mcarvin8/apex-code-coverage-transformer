'use strict';

import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { formatOptions } from '../../../src/utils/constants.js';
import {
  inputJsons,
  invalidJson,
  samplesPackagePath,
  deployCoverage,
  deployCoverage2,
  testCoverage,
} from '../../utils/testConstants.js';
import { getExtensionForFormat } from '../../../src/transformers/reportGenerator.js';
import { compareToBaselines } from '../../utils/baselineCompare.js';
import { postTestCleanup } from '../../utils/testCleanup.js';
import { preTestSetup } from '../../utils/testSetup.js';

describe('acc-transformer transform NUTs', () => {
  let session: TestSession;
  const formatString = formatOptions.map((f) => `--format ${f}`).join(' ');

  beforeAll(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    await preTestSetup();
  });

  afterAll(async () => {
    await session?.clean();
    await postTestCleanup();
  });

  inputJsons.forEach(({ label, path }) => {
    it(`transforms the ${label} command JSON file into all formats`, async () => {
      const command = `acc-transformer transform --coverage-json "${path}" --output-report "${label}.xml" ${formatString} -i "${samplesPackagePath}"`;
      const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

      const expectedOutput =
        'The coverage report has been written to: ' +
        formatOptions
          .map((f) => {
            const ext = getExtensionForFormat(f);
            return `${label}-${f}${ext}`;
          })
          .join(', ');

      expect(output.replace('\n', '')).toStrictEqual(expectedOutput);
    });
  });

  it('confirm the reports created are the same as the baselines.', async () => {
    await compareToBaselines();
  });

  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 1 }).shellOutput.stderr;

    expect(error.replace('\n', '')).toContain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.',
    );
  });

  it('excludes .cls files via **/*.cls glob pattern on deploy coverage', async () => {
    const outputPath = resolve('exclude-cls-deploy-sonar.xml');
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --output-report "${outputPath}" --format sonar -e "**/*.cls"`;
    execCmd(command, { ensureExitCode: 0 });

    const xml = await readFile(outputPath, 'utf-8');
    expect(xml).not.toContain('AccountProfile');
    expect(xml).not.toContain('AccountHandler');
    expect(xml).toContain('AccountTrigger');

    await rm(outputPath).catch(() => {});
  });

  it('accepts multiple --coverage-json flags and produces a merged report', async () => {
    const outputPath = resolve('multi-input-deploy.xml');
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --coverage-json "${deployCoverage2}" --output-report "${outputPath}" --format sonar -i "${samplesPackagePath}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output).toContain(outputPath);
    await rm(outputPath).catch(() => {});
  });

  it('exits with an error when mixing deploy and test coverage JSON types', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --coverage-json "${testCoverage}" --format sonar`;
    const error = execCmd(command, { ensureExitCode: 1 }).shellOutput.stderr;
    expect(error).toContain('All coverage JSON files must be the same type (deploy or test).');
  });

  it('excludes a single class by basename glob on test coverage', async () => {
    const outputPath = resolve('exclude-profile-test-sonar.xml');
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${outputPath}" --format sonar -e "AccountProfile*"`;
    execCmd(command, { ensureExitCode: 0 });

    const xml = await readFile(outputPath, 'utf-8');
    expect(xml).not.toContain('AccountProfile');
    expect(xml).toContain('AccountTrigger');

    await rm(outputPath).catch(() => {});
  });
});
