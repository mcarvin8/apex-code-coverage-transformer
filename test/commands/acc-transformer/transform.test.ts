'use strict';

import { copyFile, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/testSetup';
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
  const sonarDeployBaselinePath = resolve('test/deploy_coverage_baseline_sonar.xml');
  const sonarTestBaselinePath = resolve('test/test_coverage_baseline_sonar.xml');
  const sonarXmlPath1 = resolve('sonar1.xml');
  const sonarXmlPath2 = resolve('sonar2.xml');
  const sonarXmlPath3 = resolve('sonar3.xml');
  const coberturaXmlPath1 = resolve('cobertura1.xml');
  const coberturaXmlPath2 = resolve('cobertura2.xml');
  const coberturaXmlPath3 = resolve('cobertura3.xml');
  const cloverXmlPath1 = resolve('clover1.xml');
  const cloverXmlPath2 = resolve('clover2.xml');
  const cloverXmlPath3 = resolve('clover3.xml');
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
    await rm(sonarXmlPath1);
    await rm(sonarXmlPath2);
    await rm(sonarXmlPath3);
    await rm(coberturaXmlPath1);
    await rm(coberturaXmlPath2);
    await rm(coberturaXmlPath3);
    await rm(cloverXmlPath1);
    await rm(cloverXmlPath2);
    await rm(cloverXmlPath3);
  });

  it('transform the test JSON file without file extensions into Sonar format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', deployCoverageNoExts, '--xml', sonarXmlPath1]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${sonarXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test JSON file with file extensions into Sonar format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', deployCoverageWithExts, '--xml', sonarXmlPath2]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${sonarXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the JSON file from a test command into Sonar format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', testCoverage, '--xml', sonarXmlPath3]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${sonarXmlPath3}`);
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
    const deployXml1 = await readFile(sonarXmlPath1, 'utf-8');
    const deployXml2 = await readFile(sonarXmlPath2, 'utf-8');
    const testXml = await readFile(sonarXmlPath3, 'utf-8');
    const sonarDeployBaselineXmlContent = await readFile(sonarDeployBaselinePath, 'utf-8');
    const testBaselineXmlContent = await readFile(sonarTestBaselinePath, 'utf-8');
    strictEqual(
      deployXml1,
      sonarDeployBaselineXmlContent,
      `File content is different between ${sonarXmlPath1} and ${sonarDeployBaselinePath}`
    );
    strictEqual(
      deployXml2,
      sonarDeployBaselineXmlContent,
      `File content is different between ${sonarXmlPath2} and ${sonarDeployBaselinePath}`
    );
    strictEqual(
      testXml,
      testBaselineXmlContent,
      `File content is different between ${sonarXmlPath3} and ${sonarTestBaselinePath}`
    );
  });
  it('transform the test JSON file without file extensions into Cobertura format without any warnings.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverageNoExts,
      '--xml',
      coberturaXmlPath1,
      '--format',
      'cobertura',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${coberturaXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test JSON file with file extensions into Cobertura format without any warnings.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverageWithExts,
      '--xml',
      coberturaXmlPath2,
      '--format',
      'cobertura',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${coberturaXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the JSON file from a test command into Cobertura format without any warnings.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      testCoverage,
      '--xml',
      coberturaXmlPath3,
      '--format',
      'cobertura',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${coberturaXmlPath3}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test JSON file without file extensions into Clover format without any warnings.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverageNoExts,
      '--xml',
      cloverXmlPath1,
      '--format',
      'clover',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${cloverXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test JSON file with file extensions into Clover format without any warnings.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverageWithExts,
      '--xml',
      cloverXmlPath2,
      '--format',
      'clover',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${cloverXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the JSON file from a test command into Clover format without any warnings.', async () => {
    await TransformerTransform.run(['--coverage-json', testCoverage, '--xml', cloverXmlPath3, '--format', 'clover']);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage XML has been written to ${cloverXmlPath3}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
});
