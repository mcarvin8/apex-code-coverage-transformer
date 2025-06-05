/* eslint-disable no-await-in-loop */
'use strict';

import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/acc-transformer/transform.js';
import { formatOptions } from '../../../src/utils/constants.js';
import { inputJsons, defaultPath, invalidJson, deployCoverage } from './testConstants.js';
import { compareToBaselines } from './baselineCompare.js';
import { postTestCleanup } from './testCleanup.js';
import { preTestSetup } from './testSetup.js';

describe('main', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  before(async () => {
    await preTestSetup();
  });

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  after(async () => {
    await postTestCleanup();
  });

  formatOptions.forEach((format) => {
    inputJsons.forEach(({ label, path }) => {
      const reportExtension = format === 'lcovonly' ? 'info' : 'xml';
      const reportPath = resolve(`${format}_${label}.${reportExtension}`);
      it(`transforms the ${label} command JSON file into ${format} format`, async () => {
        await TransformerTransform.run(['--coverage-json', path, '--output-report', reportPath, '--format', format]);

        const output = sfCommandStubs.log
          .getCalls()
          .flatMap((c) => c.args)
          .join('\n');
        expect(output).to.include(`The coverage report has been written to ${reportPath}`);

        const warnings = sfCommandStubs.warn
          .getCalls()
          .flatMap((c) => c.args)
          .join('\n');
        expect(warnings).to.include('');
      });
    });
  });

  it('confirm the reports created are the same as the baselines.', async () => {
    await compareToBaselines();
  });

  it('confirms a failure on an invalid JSON file.', async () => {
    try {
      await TransformerTransform.run(['--coverage-json', invalidJson]);
      throw new Error('Command did not fail as expected');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.include(
          'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
        );
      } else {
        throw new Error('An unknown error type was thrown.');
      }
    }
  });

  it('ignore a package directory and produce a warning.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverage,
      '--output-report',
      defaultPath,
      '--ignore-package-directory',
      'packaged',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${defaultPath}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('The file name AccountTrigger was not found in any package directory.');
  });
});
