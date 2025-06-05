/* eslint-disable no-await-in-loop */
'use strict';

import { copyFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { formatOptions } from '../../../src/utils/constants.js';
import {
  baselineClassPath,
  baselineTriggerPath,
  configJsonString,
  sfdxConfigFile,
  inputJsons,
  defaultPath,
  invalidJson,
} from './testConstants.js';
import { compareToBaselines } from './baselineCompare.js';

describe('acc-transformer transform NUTs', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    await mkdir('force-app/main/default/classes', { recursive: true });
    await mkdir('packaged/triggers', { recursive: true });
    await copyFile(baselineClassPath, 'force-app/main/default/classes/AccountProfile.cls');
    await copyFile(baselineTriggerPath, 'packaged/triggers/AccountTrigger.trigger');
    await writeFile(sfdxConfigFile, configJsonString);
  });

  after(async () => {
    await session?.clean();
    await rm(sfdxConfigFile);
    await rm('force-app/main/default/classes/AccountProfile.cls');
    await rm('packaged/triggers/AccountTrigger.trigger');
    await rm('force-app', { recursive: true });
    await rm('packaged', { recursive: true });

    const pathsToRemove = formatOptions
      .flatMap((format) =>
        inputJsons.map(({ label }) => {
          const extension = format === 'lcovonly' ? 'info' : 'xml';
          return resolve(`${format}_${label}.${extension}`);
        })
      )
      .concat(defaultPath);

    for (const path of pathsToRemove) {
      await rm(path).catch(() => {});
    }
  });

  formatOptions.forEach((format) => {
    inputJsons.forEach(({ label, path }) => {
      const reportExtension = format === 'lcovonly' ? 'info' : 'xml';
      const reportPath = resolve(`${format}_${label}.${reportExtension}`);
      it(`transforms the ${label} command JSON file into ${format} format`, async () => {
        const command = `acc-transformer transform --coverage-json "${path}" --output-report "${reportPath}" --format ${format}`;
        const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

        expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${reportPath}`);
      });
    });
  });

  it('confirm the reports created are the same as the baselines.', async () => {
    await compareToBaselines();
  });

  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 2 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  });
});
