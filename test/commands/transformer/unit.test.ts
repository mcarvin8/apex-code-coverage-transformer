import * as fs from 'node:fs';
import * as assert from 'node:assert';
import * as path from 'node:path';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/apex-code-coverage/transformer/transform.js';

describe('transform the code coverage json', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let coverageJsonPathNoExts = 'coverage_no_file_exts.json';
  let coverageJsonPathWithExts = 'coverage_with_file_exts.json';
  let testXmlPath1 = 'coverage1.xml';
  let testXmlPath2 = 'coverage2.xml';
  coverageJsonPathNoExts = path.resolve(coverageJsonPathNoExts);
  coverageJsonPathWithExts = path.resolve(coverageJsonPathWithExts);
  testXmlPath1 = path.resolve(testXmlPath1);
  testXmlPath2 = path.resolve(testXmlPath2);

  // Mock file contents
  const mockClassContent = '// Test Apex Class';
  const mockTriggerContent = '// Test Apex Trigger';
  const mockFlowContent = '<!-- Test Flow -->';

  // Create mock files
  before(() => {
    fs.mkdirSync('force-app/main/default/classes', { recursive: true });
    fs.mkdirSync('force-app/main/default/triggers', { recursive: true });
    fs.mkdirSync('force-app/main/default/flows', { recursive: true });
    fs.writeFileSync('force-app/main/default/classes/AccountProfile.cls', mockClassContent);
    fs.writeFileSync('force-app/main/default/triggers/AccountTrigger.trigger', mockTriggerContent);
    fs.writeFileSync('force-app/main/default/flows/Get_Info.flow-meta.xml', mockFlowContent);
  });

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  // Cleanup mock files
  after(() => {
    fs.unlinkSync('force-app/main/default/classes/AccountProfile.cls');
    fs.unlinkSync('force-app/main/default/triggers/AccountTrigger.trigger');
    fs.unlinkSync('force-app/main/default/flows/Get_Info.flow-meta.xml');
    fs.rmdirSync('force-app/main/default/classes');
    fs.rmdirSync('force-app/main/default/triggers');
    fs.rmdirSync('force-app/main/default/flows');
    fs.rmSync(testXmlPath1);
    fs.rmSync(testXmlPath2);
  });

  it('transform the test JSON file without file extensions into the generic test coverage format', async () => {
    await TransformerTransform.run(['--coverage-json', coverageJsonPathNoExts, '--xml', testXmlPath1]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The XML data has been written to ${testXmlPath1}`);
  });
  it('transform the test JSON file with file extensions into the generic test coverage format', async () => {
    await TransformerTransform.run(['--coverage-json', coverageJsonPathWithExts, '--xml', testXmlPath2]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include(`The XML data has been written to ${testXmlPath2}`);
  });
  it('confirm the 2 XML files created in the previous tests match', async () => {
    const xmlContent1 = fs.readFileSync(testXmlPath1, 'utf-8');
    const xmlContent2 = fs.readFileSync(testXmlPath2, 'utf-8');
    assert.strictEqual(
      xmlContent1,
      xmlContent2,
      `File content is different between ${testXmlPath1} and ${testXmlPath2}`
    );
  });
});
