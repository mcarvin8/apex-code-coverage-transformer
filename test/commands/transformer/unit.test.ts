'use strict';

import { copyFile, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { strictEqual } from 'node:assert';
import { resolve } from 'node:path';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/apex-code-coverage/transformer/transform.js';

describe('transform the code coverage json', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let baselineClassPath = 'test/baselines/classes/AccountProfile.cls';
  let baselineTriggerPath = 'test/baselines/triggers/AccountTrigger.trigger';
  let coverageJsonPathNoExts = 'test/coverage_no_file_exts.json';
  let coverageJsonPathWithExts = 'test/coverage_with_file_exts.json';
  let testXmlPath1 = 'coverage1.xml';
  let testXmlPath2 = 'coverage2.xml';
  let sfdxConfigFile = 'sfdx-project.json';
  baselineClassPath = resolve(baselineClassPath);
  baselineTriggerPath = resolve(baselineTriggerPath);
  coverageJsonPathNoExts = resolve(coverageJsonPathNoExts);
  coverageJsonPathWithExts = resolve(coverageJsonPathWithExts);
  testXmlPath1 = resolve(testXmlPath1);
  testXmlPath2 = resolve(testXmlPath2);
  sfdxConfigFile = resolve(sfdxConfigFile);

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
    await rm('force-app/main/default/classes/AccountProfile.cls');
    await rm('packaged/triggers/AccountTrigger.trigger');
    await rm('force-app', { recursive: true });
    await rm('packaged', { recursive: true });
    await rm(testXmlPath1);
    await rm(testXmlPath2);
    await rm(sfdxConfigFile);
  });

  it('transform the test JSON file without file extensions into the generic test coverage format without any warnings', async () => {
    await TransformerTransform.run(['--coverage-json', coverageJsonPathNoExts, '--xml', testXmlPath1]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The XML data has been written to ${testXmlPath1}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('transform the test JSON file with file extensions into the generic test coverage format without any warnings', async () => {
    await TransformerTransform.run(['--coverage-json', coverageJsonPathWithExts, '--xml', testXmlPath2]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The XML data has been written to ${testXmlPath2}`);
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('confirm the 2 XML files created in the previous tests match', async () => {
    const xmlContent1 = await readFile(testXmlPath1, 'utf-8');
    const xmlContent2 = await readFile(testXmlPath2, 'utf-8');
    strictEqual(xmlContent1, xmlContent2, `File content is different between ${testXmlPath1} and ${testXmlPath2}`);
  });
});
