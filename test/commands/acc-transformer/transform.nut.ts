'use strict';

import { copyFile, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

describe('acc-transformer transform NUTs', () => {
  let session: TestSession;
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
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    await writeFile(sfdxConfigFile, configJsonString);
    await mkdir('force-app/main/default/classes', { recursive: true });
    await mkdir('packaged/triggers', { recursive: true });
    await copyFile(baselineClassPath, 'force-app/main/default/classes/AccountProfile.cls');
    await copyFile(baselineTriggerPath, 'packaged/triggers/AccountTrigger.trigger');
  });

  after(async () => {
    await session?.clean();
    await rm(sfdxConfigFile);
    await rm('force-app/main/default/classes/AccountProfile.cls');
    await rm('packaged/triggers/AccountTrigger.trigger');
    await rm('force-app', { recursive: true });
    await rm('packaged', { recursive: true });
    await rm(coverageXmlPath1);
    await rm(coverageXmlPath2);
    await rm(coverageXmlPath3);
  });

  it('runs transform on the deploy coverage file without file extensions.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --xml "${coverageXmlPath1}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${coverageXmlPath1}`);
  });

  it('runs transform on the deploy coverage file with file extensions.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --xml "${coverageXmlPath2}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${coverageXmlPath2}`);
  });

  it('runs transform on the test coverage file.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --xml "${coverageXmlPath3}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${coverageXmlPath3}`);
  });
  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 2 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
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
      `File content is different between ${coverageXmlPath2} and ${testBaselineXmlPath}`
    );
  });
});
