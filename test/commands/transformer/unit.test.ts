import * as fs from 'node:fs';
import * as path from 'node:path';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/apex-code-coverage/transformer/transform.js';

describe('transform the code coverage json', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let testJsonPath = 'test.json';
  let testXmlPath = 'coverage.xml';
  testJsonPath = path.resolve(testJsonPath);
  testXmlPath = path.resolve(testXmlPath);

  // Mock file contents
  const mockClassContent = '// Test Apex Class';
  const mockTriggerContent = '// Test Apex Trigger';

  // Create mock files
  before(() => {
    fs.mkdirSync('force-app/main/default/classes', { recursive: true });
    fs.mkdirSync('force-app/main/default/triggers', { recursive: true });
    fs.writeFileSync('force-app/main/default/classes/AccountProfile.cls', mockClassContent);
    fs.writeFileSync('force-app/main/default/triggers/AccountTrigger.trigger', mockTriggerContent);
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
    fs.rmdirSync('force-app/main/default/classes');
    fs.rmdirSync('force-app/main/default/triggers');
  });

  it('transform the test JSON file into the generic test coverage format', async () => {
    await TransformerTransform.run(['--coverage-json', testJsonPath]);
      const output = sfCommandStubs.log
        .getCalls()
        .flatMap((c) => c.args)
        .join('\n');
      expect(output).to.include(`The XML data has been written to ${testXmlPath}`);
  });
});
