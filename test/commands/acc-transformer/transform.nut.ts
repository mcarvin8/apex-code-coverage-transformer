/* eslint-disable no-await-in-loop */
'use strict';

import { resolve } from 'node:path';
import { describe, it } from '@jest/globals';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { formatOptions } from '../../../src/utils/constants.js';
import { inputJsons, invalidJson } from '../../utils/testConstants.js';
import { compareToBaselines } from '../../utils/baselineCompare.js';
import { postTestCleanup } from '../../utils/testCleanup.js';
import { preTestSetup } from '../../utils/testSetup.js';

describe('acc-transformer transform NUTs', () => {
  let session: TestSession;

  beforeAll(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    await preTestSetup();
  });

  afterAll(async () => {
    await session?.clean();
    await postTestCleanup();
  });

  formatOptions.forEach((format) => {
    inputJsons.forEach(({ label, path }) => {
      const reportExtension = format === 'lcovonly' ? 'info' : 'xml';
      const reportPath = resolve(`${format}_${label}.${reportExtension}`);
      it(`transforms the ${label} command JSON file into ${format} format`, async () => {
        const command = `acc-transformer transform --coverage-json "${path}" --output-report "${reportPath}" --format ${format} -i "samples"`;
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
    const error = execCmd(command, { ensureExitCode: 1 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  });
});
