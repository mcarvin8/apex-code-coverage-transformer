/* eslint-disable no-await-in-loop */
'use strict';

import { copyFile, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/testSetup';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/acc-transformer/transform.js';
import { formatOptions } from '../../../src/utils/constants.js';
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
  const defaultPath = resolve('coverage.xml');
  const sfdxConfigFile = resolve('sfdx-project.json');

  const configFile = {
    packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }],
    namespace: '',
    sfdcLoginUrl: 'https://login.salesforce.com',
    sourceApiVersion: '58.0',
  };
  const configJsonString = JSON.stringify(configFile, null, 2);
  const inputJsons = [
    { label: 'deploy', path: deployCoverage },
    { label: 'test', path: testCoverage },
  ] as const;

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

    const pathsToRemove = formatOptions
      .flatMap((format) =>
        inputJsons.map(({ label }) => {
          const extension = format === 'lcovonly' ? 'info' : 'xml';
          return resolve(`${format}_${label}.${extension}`);
        })
      )
      .concat(defaultPath);

    for (const path of pathsToRemove) {
      // eslint-disable-next-line no-await-in-loop
      await rm(path).catch(() => {});
    }
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
    const baselineMap = {
      sonar: sonarBaselinePath,
      lcovonly: lcovBaselinePath,
      jacoco: jacocoBaselinePath,
      cobertura: coberturaBaselinePath,
      clover: cloverBaselinePath,
    } as const;

    const normalizationRequired = new Set(['cobertura', 'clover']);

    for (const format of formatOptions as Array<keyof typeof baselineMap>) {
      for (const { label } of inputJsons) {
        const reportExtension = format === 'lcovonly' ? 'info' : 'xml';
        const outputPath = resolve(`${format}_${label}.${reportExtension}`);
        const outputContent = await readFile(outputPath, 'utf-8');
        const baselineContent = await readFile(baselineMap[format], 'utf-8');

        if (normalizationRequired.has(format)) {
          strictEqual(
            normalizeCoverageReport(outputContent),
            normalizeCoverageReport(baselineContent),
            `Mismatch between ${outputPath} and ${baselineMap[format]}`
          );
        } else {
          strictEqual(outputContent, baselineContent, `Mismatch between ${outputPath} and ${baselineMap[format]}`);
        }
      }
    }
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
