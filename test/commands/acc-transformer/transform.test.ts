'use strict';

import { copyFile, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/acc-transformer/transform.js';
import { normalizeCoverageReport } from './normalizeCoverageReport.js';

describe('main', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  const baselineClassPath = resolve('test/baselines/classes/AccountProfile.cls');
  const baselineTriggerPath = resolve('test/baselines/triggers/AccountTrigger.trigger');
  const deployCoverage = resolve('test/deploy_coverage.json');
  const testCoverage = resolve('test/test_coverage.json');
  const invalidJson = resolve('test/invalid.json');
  const sonarBaselinePath = resolve('test/sonar_baseline.xml');
  const jacocoBaselinePath = resolve('test/jacoco_baseline.xml');
  const lcovBaselinePath = resolve('test/lcov_baseline.info');
  const coberturaBaselinePath = resolve('test/cobertura_baseline.xml');
  const cloverBaselinePath = resolve('test/clover_baseline.xml');
  const sonarXmlPath1 = resolve('sonar1.xml');
  const sonarXmlPath2 = resolve('sonar2.xml');
  const coberturaXmlPath1 = resolve('cobertura1.xml');
  const coberturaXmlPath2 = resolve('cobertura2.xml');
  const cloverXmlPath1 = resolve('clover1.xml');
  const cloverXmlPath2 = resolve('clover2.xml');
  const lcovPath1 = resolve('lcov1.info');
  const lcovPath2 = resolve('lcov2.info');
  const jacocoXmlPath1 = resolve('jacoco1.xml');
  const jacocoXmlPath2 = resolve('jacoco2.xml');
  const defaultPath = resolve('coverage.xml');
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
    await rm(coberturaXmlPath1);
    await rm(coberturaXmlPath2);
    await rm(cloverXmlPath1);
    await rm(cloverXmlPath2);
    await rm(lcovPath1);
    await rm(lcovPath2);
    await rm(jacocoXmlPath1);
    await rm(jacocoXmlPath2);
    await rm(defaultPath);
  });

  it('transform the deploy command JSON file into Sonar format.', async () => {
    await TransformerTransform.run(['--coverage-json', deployCoverage, '--output-report', sonarXmlPath1]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${sonarXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test command JSON file into Sonar format.', async () => {
    await TransformerTransform.run(['--coverage-json', testCoverage, '--output-report', sonarXmlPath2]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${sonarXmlPath2}`);
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

  it('transform the deploy command JSON file into Cobertura format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverage,
      '--output-report',
      coberturaXmlPath1,
      '--format',
      'cobertura',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${coberturaXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test command JSON file into Cobertura format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      testCoverage,
      '--output-report',
      coberturaXmlPath2,
      '--format',
      'cobertura',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${coberturaXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the deploy command JSON file into Clover format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverage,
      '--output-report',
      cloverXmlPath1,
      '--format',
      'clover',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${cloverXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test command JSON file into Clover format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      testCoverage,
      '--output-report',
      cloverXmlPath2,
      '--format',
      'clover',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${cloverXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the deploy command JSON file into Lcov format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverage,
      '--output-report',
      lcovPath1,
      '--format',
      'lcovonly',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${lcovPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test command JSON file into Lcov format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      testCoverage,
      '--output-report',
      lcovPath2,
      '--format',
      'lcovonly',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${lcovPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the deploy command JSON file into JaCoCo format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      deployCoverage,
      '--output-report',
      jacocoXmlPath1,
      '--format',
      'jacoco',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${jacocoXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test command JSON file into JaCoCo format.', async () => {
    await TransformerTransform.run([
      '--coverage-json',
      testCoverage,
      '--output-report',
      jacocoXmlPath2,
      '--format',
      'jacoco',
    ]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The coverage report has been written to ${jacocoXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('confirm the reports created are the same as the baselines.', async () => {
    const sonarXml1 = await readFile(sonarXmlPath1, 'utf-8');
    const sonarXml2 = await readFile(sonarXmlPath2, 'utf-8');
    const lcov1 = await readFile(lcovPath1, 'utf-8');
    const lcov2 = await readFile(lcovPath2, 'utf-8');
    const jacocoXml1 = await readFile(jacocoXmlPath1, 'utf-8');
    const jacocoXml2 = await readFile(jacocoXmlPath2, 'utf-8');
    const coberturaXml1 = await readFile(coberturaXmlPath1, 'utf-8');
    const coberturaXml2 = await readFile(coberturaXmlPath2, 'utf-8');
    const cloverXml1 = await readFile(cloverXmlPath1, 'utf-8');
    const cloverXml2 = await readFile(cloverXmlPath2, 'utf-8');

    const sonarBaselineContent = await readFile(sonarBaselinePath, 'utf-8');
    const lcovBaselineContent = await readFile(lcovBaselinePath, 'utf-8');
    const jacocoBaselineContent = await readFile(jacocoBaselinePath, 'utf-8');
    const coberturaBaselineContent = await readFile(coberturaBaselinePath, 'utf-8');
    const cloverBaselineContent = await readFile(cloverBaselinePath, 'utf-8');

    strictEqual(sonarXml1, sonarBaselineContent, `Mismatch between ${sonarXmlPath1} and ${sonarBaselinePath}`);
    strictEqual(sonarXml2, sonarBaselineContent, `Mismatch between ${sonarXmlPath2} and ${sonarBaselinePath}`);
    strictEqual(lcov1, lcovBaselineContent, `Mismatch between ${lcovPath1} and ${lcovBaselinePath}`);
    strictEqual(lcov2, lcovBaselineContent, `Mismatch between ${lcovPath2} and ${lcovBaselinePath}`);
    strictEqual(jacocoXml1, jacocoBaselineContent, `Mismatch between ${jacocoXmlPath1} and ${jacocoBaselinePath}`);
    strictEqual(jacocoXml2, jacocoBaselineContent, `Mismatch between ${jacocoXmlPath2} and ${jacocoBaselinePath}`);

    // Normalize before comparing reports with timestamps
    strictEqual(
      normalizeCoverageReport(coberturaXml1),
      normalizeCoverageReport(coberturaBaselineContent),
      `Mismatch between ${coberturaXmlPath1} and ${coberturaBaselinePath}`
    );
    strictEqual(
      normalizeCoverageReport(coberturaXml2),
      normalizeCoverageReport(coberturaBaselineContent),
      `Mismatch between ${coberturaXmlPath2} and ${coberturaBaselinePath}`
    );
    strictEqual(
      normalizeCoverageReport(cloverXml1),
      normalizeCoverageReport(cloverBaselineContent),
      `Mismatch between ${cloverXmlPath1} and ${cloverBaselinePath}`
    );
    strictEqual(
      normalizeCoverageReport(cloverXml2),
      normalizeCoverageReport(cloverBaselineContent),
      `Mismatch between ${cloverXmlPath2} and ${cloverBaselinePath}`
    );
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
