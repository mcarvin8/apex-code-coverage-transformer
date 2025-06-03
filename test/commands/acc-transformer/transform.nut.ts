/* eslint-disable no-await-in-loop */
'use strict';

import { copyFile, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { formatOptions } from '../../../src/utils/constants.js';
import { normalizeCoverageReport } from './normalizeCoverageReport.js';

describe('acc-transformer transform NUTs', () => {
  let session: TestSession;
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
      // eslint-disable-next-line no-await-in-loop
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

  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 2 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
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
});
