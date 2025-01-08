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
  const sonarDeployBaselinePath = resolve('test/deploy_coverage_baseline_sonar.xml');
  const sonarTestBaselinePath = resolve('test/test_coverage_baseline_sonar.xml');
  const lcovDeployBaselinePath = resolve('test/deploy_coverage_baseline_lcov.info');
  const lcovTestBaselinePath = resolve('test/test_coverage_baseline_lcov.info');
  const sonarXmlPath1 = resolve('sonar1.xml');
  const sonarXmlPath2 = resolve('sonar2.xml');
  const sonarXmlPath3 = resolve('sonar3.xml');
  const coberturaXmlPath1 = resolve('cobertura1.xml');
  const coberturaXmlPath2 = resolve('cobertura2.xml');
  const coberturaXmlPath3 = resolve('cobertura3.xml');
  const cloverXmlPath1 = resolve('clover1.xml');
  const cloverXmlPath2 = resolve('clover2.xml');
  const cloverXmlPath3 = resolve('clover3.xml');
  const lcovPath1 = resolve('lcov1.info');
  const lcovPath2 = resolve('lcov2.info');
  const lcovPath3 = resolve('lcov3.info');
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
    await rm(cloverXmlPath1);
    await rm(cloverXmlPath2);
    await rm(cloverXmlPath3);
    await rm(lcovPath1);
    await rm(lcovPath2);
    await rm(lcovPath3);
  });

  it('runs transform on the deploy coverage file without file extensions in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --output-report "${sonarXmlPath1}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${sonarXmlPath1}`);
  });

  it('runs transform on the deploy coverage file with file extensions in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --output-report "${sonarXmlPath2}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${sonarXmlPath2}`);
  });

  it('runs transform on the test coverage file in Sonar format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${sonarXmlPath3}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${sonarXmlPath3}`);
  });
  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 2 }).shellOutput.stderr;

    expect(error.replace('\n', '')).to.contain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  });
  it('runs transform on the deploy coverage file without file extensions in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --output-report "${coberturaXmlPath1}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${coberturaXmlPath1}`);
  });
  it('runs transform on the deploy coverage file with file extensions in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --output-report "${coberturaXmlPath2}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${coberturaXmlPath2}`);
  });
  it('runs transform on the test coverage file in Cobertura format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${coberturaXmlPath3}" --format cobertura`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${coberturaXmlPath3}`);
  });
  it('runs transform on the deploy coverage file without file extensions in Clover format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --output-report "${cloverXmlPath1}" --format clover`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${cloverXmlPath1}`);
  });
  it('runs transform on the deploy coverage file with file extensions in Clover format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --output-report "${cloverXmlPath2}" --format clover`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${cloverXmlPath2}`);
  });
  it('runs transform on the test coverage file in Clover format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${cloverXmlPath3}" --format clover`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${cloverXmlPath3}`);
  });
  it('runs transform on the deploy coverage file without file extensions in Lcov format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --output-report "${lcovPath1}" --format lcovonly`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${lcovPath1}`);
  });
  it('runs transform on the deploy coverage file with file extensions in Lcov format.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --output-report "${lcovPath2}" --format lcovonly`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${lcovPath2}`);
  });
  it('runs transform on the test coverage file in Lcov format.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --output-report "${lcovPath3}" --format lcovonly`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage report has been written to ${lcovPath3}`);
  });
  it('confirm the reports created are the same as the baselines.', async () => {
    const sonarXml1 = await readFile(sonarXmlPath1, 'utf-8');
    const sonarXml2 = await readFile(sonarXmlPath2, 'utf-8');
    const sonarXml3 = await readFile(sonarXmlPath3, 'utf-8');
    const lcov1 = await readFile(lcovPath1, 'utf-8');
    const lcov2 = await readFile(lcovPath2, 'utf-8');
    const lcov3 = await readFile(lcovPath3, 'utf-8');
    const sonarDeployBaselineXmlContent = await readFile(sonarDeployBaselinePath, 'utf-8');
    const sonarTestBaselineXmlContent = await readFile(sonarTestBaselinePath, 'utf-8');
    const lcovDeployBaselineContent = await readFile(lcovDeployBaselinePath, 'utf-8');
    const lcovTestBaselineContent = await readFile(lcovTestBaselinePath, 'utf-8');
    strictEqual(
      sonarXml1,
      sonarDeployBaselineXmlContent,
      `File content is different between ${sonarXmlPath1} and ${sonarDeployBaselinePath}`
    );
    strictEqual(
      sonarXml2,
      sonarDeployBaselineXmlContent,
      `File content is different between ${sonarXmlPath2} and ${sonarDeployBaselinePath}`
    );
    strictEqual(
      sonarXml3,
      sonarTestBaselineXmlContent,
      `File content is different between ${sonarXmlPath3} and ${sonarTestBaselinePath}`
    );
    strictEqual(
      lcov1,
      lcovDeployBaselineContent,
      `File content is different between ${lcovPath1} and ${lcovDeployBaselinePath}`
    );
    strictEqual(
      lcov2,
      lcovDeployBaselineContent,
      `File content is different between ${lcovPath2} and ${lcovDeployBaselinePath}`
    );
    strictEqual(
      lcov3,
      lcovTestBaselineContent,
      `File content is different between ${lcovPath3} and ${lcovTestBaselinePath}`
    );
  });
});
