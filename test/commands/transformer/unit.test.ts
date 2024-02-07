import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import TransformerTransform from '../../../src/commands/apex-code-coverage/transformer/transform.js';

describe('transform the code coverage json', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  const testJsonPath = 'test.json';
  const testXmlPath = 'coverage.xml';

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
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
