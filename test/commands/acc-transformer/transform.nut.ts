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
  const deployCoverage = resolve('test/deploy_coverage.json');
  const testCoverage = resolve('test/test_coverage.json');
  const invalidJson = resolve('test/invalid.json');
  const sonarBaselinePath = resolve('test/sonar_baseline.xml');
  const jacocoBaselinePath = resolve('test/jacoco_baseline.xml');
  const lcovBaselinePath = resolve('test/lcov_baseline.info');
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
    await rm(coberturaXmlPath1);
    await rm(coberturaXmlPath2);
    await rm(cloverXmlPath1);
    await rm(cloverXmlPath2);
    await rm(lcovPath1);
    await rm(lcovPath2);
    await rm(jacocoXmlPath1);
    await rm(jacocoXmlPath2);
  });

  it('runs transform on the deploy command coverage file in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --output-report "${sonarXmlPath1}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${sonarXmlPath1}`);
  });

  it('runs transform on the test command coverage file in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${sonarXmlPath2}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${sonarXmlPath2}`);
  });
  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 2 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  });
  it('runs transform on the deploy command coverage file in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --output-report "${coberturaXmlPath1}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${coberturaXmlPath1}`);
  });
  it('runs transform on the test command coverage file in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${coberturaXmlPath2}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${coberturaXmlPath2}`);
  });
  it('runs transform on the deploy command coverage file in Clover format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --output-report "${cloverXmlPath1}" --format clover`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${cloverXmlPath1}`);
  });
  it('runs transform on the test command coverage file in Clover format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${cloverXmlPath2}" --format clover`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${cloverXmlPath2}`);
  });
  it('runs transform on the deploy command coverage file in Lcov format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --output-report "${lcovPath1}" --format lcovonly`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${lcovPath1}`);
  });
  it('runs transform on the test command coverage file in Lcov format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${lcovPath2}" --format lcovonly`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${lcovPath2}`);
  });
  it('runs transform on the deploy command coverage file in JaCoCo format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverage}" --output-report "${jacocoXmlPath1}" --format jacoco`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${jacocoXmlPath1}`);
  });
  it('runs transform on the test command coverage file in JaCoCo format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${jacocoXmlPath2}" --format jacoco`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${jacocoXmlPath2}`);
  });
  it('confirm the reports created are the same as the baselines.', async () => {
    const sonarXml1 = await readFile(sonarXmlPath1, 'utf-8');
    const sonarXml2 = await readFile(sonarXmlPath2, 'utf-8');
    const lcov1 = await readFile(lcovPath1, 'utf-8');
    const lcov2 = await readFile(lcovPath2, 'utf-8');
    const jacocoXml1 = await readFile(jacocoXmlPath1, 'utf-8');
    const jacocoXml2 = await readFile(jacocoXmlPath2, 'utf-8');
    const sonarBaselineContent = await readFile(sonarBaselinePath, 'utf-8');
    const lcovBaselineContent = await readFile(lcovBaselinePath, 'utf-8');
    const jacocoBaselineContent = await readFile(jacocoBaselinePath, 'utf-8');
    strictEqual(
      sonarXml1,
      sonarBaselineContent,
      `File content is different between ${sonarXmlPath1} and ${sonarBaselinePath}`
    );
    strictEqual(
      sonarXml2,
      sonarBaselineContent,
      `File content is different between ${sonarXmlPath2} and ${sonarBaselinePath}`
    );
    strictEqual(lcov1, lcovBaselineContent, `File content is different between ${lcovPath1} and ${lcovBaselinePath}`);
    strictEqual(lcov2, lcovBaselineContent, `File content is different between ${lcovPath2} and ${lcovBaselinePath}`);
    strictEqual(
      jacocoXml1,
      jacocoBaselineContent,
      `File content is different between ${jacocoXmlPath1} and ${jacocoBaselinePath}`
    );
    strictEqual(
      jacocoXml2,
      jacocoBaselineContent,
      `File content is different between ${jacocoXmlPath2} and ${jacocoBaselinePath}`
    );
  });
});
