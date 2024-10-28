'use strict';

import { copyFile, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/acc-transformer/transform.js';

describe('main', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  const baselineClassPath = resolve('test/baselines/classes/AccountProfile.cls');
  const baselineTriggerPath = resolve('test/baselines/triggers/AccountTrigger.trigger');
  const deployCoverageNoExts = resolve('test/deploy_coverage_no_file_exts.json');
  const deployCoverageWithExts = resolve('test/deploy_coverage_with_file_exts.json');
  const testCoverage = resolve('test/test_coverage.json');
  const invalidJson = resolve('test/invalid.json');
  const deployBaselineXmlPath = resolve('test/deploy_coverage_baseline.xml');
  const testBaselineXmlPath = resolve('test/test_coverage_baseline.xml');
  const coverageXmlPath1 = resolve('coverage1.xml');
  const coverageXmlPath2 = resolve('coverage2.xml');
  const coverageXmlPath3 = resolve('coverage3.xml');
  const sfdxConfigFile = resolve('sfdx-project.json');

  const configFile = {
    packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }],
    namespace: '',
    sfdcLoginUrl: 'https://login.salesforce.com',
    sourceApiVersion: '58.0',
  };
  const configJsonString = JSON.stringify(configFile, null, 2);

  before(async () => {
    await mkdir('force-app/main/default/classes', { recursive: true });
    await mkdir('packaged/triggers', { recursive: true });
    await copyFile(baselineClassPath, 'force-app/main/default/classes/AccountProfile.cls');
    await copyFile(baselineTriggerPath, 'packaged/triggers/AccountTrigger.trigger');
    await writeFile(sfdxConfigFile, configJsonString);
  });

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  after(async () => {
    await rm(sfdxConfigFile);
    await rm('force-app/main/default/classes/AccountProfile.cls');
    await rm('packaged/triggers/AccountTrigger.trigger');
    await rm('force-app', { recursive: true });
    await rm('packaged', { recursive: true });
    await rm(coverageXmlPath1);
    await rm(coverageXmlPath2);
    await rm(coverageXmlPath3);
  });

  it('transform the test JSON file without file extensions into the generic test coverage format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', deployCoverageNoExts, '--xml', coverageXmlPath1]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${coverageXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test JSON file with file extensions into the generic test coverage format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', deployCoverageWithExts, '--xml', coverageXmlPath2]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${coverageXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the JSON file from a test command into the generic test coverage format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', testCoverage, '--xml', coverageXmlPath3]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${coverageXmlPath3}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
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
  it('confirm the XML files created are the same as the baselines.', async () => {
    const deployXml1 = await readFile(coverageXmlPath1, 'utf-8');
    const deployXml2 = await readFile(coverageXmlPath2, 'utf-8');
    const testXml = await readFile(coverageXmlPath3, 'utf-8');
    const deployBaselineXmlContent = await readFile(deployBaselineXmlPath, 'utf-8');
    const testBaselineXmlContent = await readFile(testBaselineXmlPath, 'utf-8');
    strictEqual(
      deployXml1,
      deployBaselineXmlContent,
      `File content is different between ${coverageXmlPath1} and ${deployBaselineXmlPath}`
    );
    strictEqual(
      deployXml2,
      deployBaselineXmlContent,
      `File content is different between ${coverageXmlPath2} and ${deployBaselineXmlPath}`
    );
    strictEqual(
      testXml,
      testBaselineXmlContent,
      `File content is different between ${coverageXmlPath3} and ${testBaselineXmlPath}`
    );
  });
});
