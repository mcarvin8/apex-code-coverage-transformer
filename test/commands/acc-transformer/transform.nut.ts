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
  const baselineXmlPath = resolve('test/coverage_baseline.xml');
  const testXmlPath1 = resolve('coverage1.xml');
  const testXmlPath2 = resolve('coverage2.xml');
  const testXmlPath3 = resolve('coverage3.xml');

  const configFile = {
    packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }],
    namespace: '',
    sfdcLoginUrl: 'https://login.salesforce.com',
    sourceApiVersion: '58.0',
  };
  const configJsonString = JSON.stringify(configFile, null, 2);

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    await writeFile('sfdx-project.json', configJsonString);
    await mkdir('force-app/main/default/classes', { recursive: true });
    await mkdir('packaged/triggers', { recursive: true });
    await copyFile(baselineClassPath, 'force-app/main/default/classes/AccountProfile.cls');
    await copyFile(baselineTriggerPath, 'packaged/triggers/AccountTrigger.trigger');
  });

  after(async () => {
    await session?.clean();
    await rm('sfdx-project.json');
    await rm('force-app/main/default/classes/AccountProfile.cls');
    await rm('packaged/triggers/AccountTrigger.trigger');
    await rm('force-app', { recursive: true });
    await rm('packaged', { recursive: true });
    await rm(testXmlPath1);
    await rm(testXmlPath2);
    await rm(testXmlPath3);
  });

  it('runs transform on the deploy coverage file without file extensions.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageNoExts}" --xml "${testXmlPath1}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${testXmlPath1}`);
  });

  it('runs transform on the deploy coverage file with file extensions.', async () => {
    const command = `acc-transformer transform --coverage-json "${deployCoverageWithExts}" --xml "${testXmlPath2}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${testXmlPath2}`);
  });

  it('runs transform on the test coverage file.', async () => {
    const command = `acc-transformer transform --coverage-json "${testCoverage}" --xml "${testXmlPath3}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal(`The coverage XML has been written to ${testXmlPath3}`);
  });
  it('confirm the 2 XML files created in the previous tests are the same as the baseline.', async () => {
    const xmlContent1 = await readFile(testXmlPath1, 'utf-8');
    const xmlContent2 = await readFile(testXmlPath2, 'utf-8');
    const baselineXmlContent = await readFile(baselineXmlPath, 'utf-8');
    strictEqual(
      xmlContent1,
      baselineXmlContent,
      `File content is different between ${testXmlPath1} and ${baselineXmlPath}`
    );
    strictEqual(
      xmlContent2,
      baselineXmlContent,
      `File content is different between ${testXmlPath2} and ${baselineXmlPath}`
    );
  });
});
