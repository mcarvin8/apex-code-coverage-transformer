/* eslint-disable no-await-in-loop */
'use strict';
import { resolve } from 'node:path';
import { describe, it, expect } from '@jest/globals';

import { TestContext } from '@salesforce/core/testSetup';
import { transformCoverageReport } from '../../../src/transformers/coverageTransformer.js';
import { formatOptions } from '../../../src/utils/constants.js';
import { getCoverageHandler } from '../../../src/handlers/getHandler.js';
import { checkCoverageDataType } from '../../../src/utils/setCoverageDataType.js';
import { DeployCoverageData } from '../../../src/utils/types.js';
import { inputJsons, invalidJson, deployCoverage, testCoverage } from '../../utils/testConstants.js';
import { compareToBaselines } from '../../utils/baselineCompare.js';
import { postTestCleanup } from '../../utils/testCleanup.js';
import { preTestSetup } from '../../utils/testSetup.js';

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
        await transformCoverageReport(path, reportPath, format, ['samples']);
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
        expect(error.message).toContain(
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
        expect(error.message).toContain('Unsupported format: invalid');
      } else {
        throw new Error('An unknown error type was thrown.');
      }
    }
  });
  it('confirms a warning with a JSON file that does not exist.', async () => {
    const result = await transformCoverageReport('nonexistent.json', 'coverage.xml', 'sonar', []);
    expect(result.warnings).toContain('Failed to read nonexistent.json. Confirm file exists.');
  });
  it('ignore a package directory and produce a warning on the deploy command report.', async () => {
    const result = await transformCoverageReport(deployCoverage, 'coverage.xml', 'sonar', [
      'packaged',
      'force-app',
      'samples',
    ]);
    expect(result.warnings).toContain('The file name AccountTrigger was not found in any package directory.');
  });
  it('ignore a package directory and produce a warning on the test command report.', async () => {
    const result = await transformCoverageReport(testCoverage, 'coverage.xml', 'sonar', ['packaged', 'samples']);
    expect(result.warnings).toContain('The file name AccountTrigger was not found in any package directory.');
  });
  it('test where a statementMap has a non-object value.', async () => {
    const invalidDeployData = {
      'someFile.js': {
        path: 'someFile.js',
        fnMap: {},
        branchMap: {},
        f: {},
        b: {},
        s: {},
        statementMap: {
          someStatement: null,
        },
      },
    };

    const result = checkCoverageDataType(invalidDeployData as unknown as DeployCoverageData);
    expect(result).toStrictEqual('Unknown');
  });
  it('create a cobertura report using only 1 package directory', async () => {
    await transformCoverageReport(deployCoverage, 'coverage.xml', 'cobertura', ['packaged', 'force-app']);
  });
  it('create a jacoco report using only 1 package directory', async () => {
    await transformCoverageReport(deployCoverage, 'coverage.xml', 'jacoco', ['packaged', 'force-app']);
  });
});
