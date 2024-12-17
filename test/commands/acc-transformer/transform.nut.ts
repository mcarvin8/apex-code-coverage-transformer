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
  const sonarXmlPath1 = resolve('sonar1.xml');
  const sonarXmlPath2 = resolve('sonar2.xml');
  const sonarXmlPath3 = resolve('sonar3.xml');
  const coberturaXmlPath1 = resolve('cobertura1.xml');
  const coberturaXmlPath2 = resolve('cobertura2.xml');
  const coberturaXmlPath3 = resolve('cobertura3.xml');
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
    await rm(sonarXmlPath1);
    await rm(sonarXmlPath2);
    await rm(sonarXmlPath3);
    await rm(coberturaXmlPath1);
    await rm(coberturaXmlPath2);
    await rm(coberturaXmlPath3);
  });

  it('runs transform on the deploy coverage file without file extensions in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --xml "${sonarXmlPath1}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${sonarXmlPath1}`);
  });

  it('runs transform on the deploy coverage file with file extensions in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --xml "${sonarXmlPath2}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${sonarXmlPath2}`);
  });

  it('runs transform on the test coverage file in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --xml "${sonarXmlPath3}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${sonarXmlPath3}`);
  });
  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 2 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  });

  it('confirm the XML files created are the same as the baselines.', async () => {
    const deployXml1 = await readFile(sonarXmlPath1, 'utf-8');
    const deployXml2 = await readFile(sonarXmlPath2, 'utf-8');
    const testXml = await readFile(sonarXmlPath3, 'utf-8');
    const deployBaselineXmlContent = await readFile(deployBaselineXmlPath, 'utf-8');
    const testBaselineXmlContent = await readFile(testBaselineXmlPath, 'utf-8');
    strictEqual(
      deployXml1,
      deployBaselineXmlContent,
      `File content is different between ${sonarXmlPath1} and ${deployBaselineXmlPath}`
    );
    strictEqual(
      deployXml2,
      deployBaselineXmlContent,
      `File content is different between ${sonarXmlPath2} and ${deployBaselineXmlPath}`
    );
    strictEqual(
      testXml,
      testBaselineXmlContent,
      `File content is different between ${sonarXmlPath3} and ${testBaselineXmlPath}`
    );
  });
  it('runs transform on the deploy coverage file without file extensions in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --xml "${coberturaXmlPath1}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${coberturaXmlPath1}`);
  });

  it('runs transform on the deploy coverage file with file extensions in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --xml "${coberturaXmlPath2}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${coberturaXmlPath2}`);
  });

  it('runs transform on the test coverage file in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --xml "${coberturaXmlPath3}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${coberturaXmlPath3}`);
  });
});
