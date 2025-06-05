/// <reference types="jest" />
/* eslint-disable no-await-in-loop */
'use strict';
import { resolve } from 'node:path';
import { describe, it } from '@jest/globals';

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { transformCoverageReport } from '../../../src/transformers/coverageTransformer.js';
import { formatOptions } from '../../../src/utils/constants.js';
import { getCoverageHandler } from '../../../src/handlers/getHandler.js';
import { inputJsons, invalidJson, deployCoverage, testCoverage } from './testConstants.js';
import { compareToBaselines } from './baselineCompare.js';
import { postTestCleanup } from './testCleanup.js';
import { preTestSetup } from './testSetup.js';

describe('main', () => {
  const $$ = new TestContext();

  beforeAll(async () => {
    await preTestSetup();
  });

  afterEach(() => {
    $$.restore();
  });

  afterAll(async () => {
    await postTestCleanup();
  });

  formatOptions.forEach((format) => {
    inputJsons.forEach(({ label, path }) => {
      const reportExtension = format === 'lcovonly' ? 'info' : 'xml';
      const reportPath = resolve(`${format}_${label}.${reportExtension}`);
      it(`transforms the ${label} command JSON file into ${format} format`, async () => {
        await transformCoverageReport(path, reportPath, format, []);
      });
    });
  });
  it('confirm the reports created are the same as the baselines.', async () => {
    await compareToBaselines();
  });
  it('confirms a failure on an invalid JSON file.', async () => {
    try {
      await transformCoverageReport(invalidJson, 'coverage.xml', 'sonar', []);
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
  it('confirms a failure with an invalid format.', async () => {
    try {
      getCoverageHandler('invalid');
      throw new Error('Command did not fail as expected');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.include('Unsupported format: invalid');
      } else {
        throw new Error('An unknown error type was thrown.');
      }
    }
  });
  it('confirms a warning with a JSON file that does not exist.', async () => {
    const result = await transformCoverageReport('nonexistent.json', 'coverage.xml', 'sonar', []);
    expect(result.warnings).to.include('Failed to read nonexistent.json. Confirm file exists.');
  });
  it('ignore a package directory and produce a warning on the deploy command report.', async () => {
    const result = await transformCoverageReport(deployCoverage, 'coverage.xml', 'sonar', ['packaged', 'force-app']);
    expect(result.warnings).to.include('The file name AccountTrigger was not found in any package directory.');
  });
  it('ignore a package directory and produce a warning on the test command report.', async () => {
    const result = await transformCoverageReport(testCoverage, 'coverage.xml', 'sonar', ['packaged']);
    expect(result.warnings).to.include('The file name AccountTrigger was not found in any package directory.');
  });
});
