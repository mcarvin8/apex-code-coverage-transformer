'use strict';

import { describe, it, expect } from '@jest/globals';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { formatOptions } from '../../../src/utils/constants.js';
import { inputJsons, invalidJson } from '../../utils/testConstants.js';
import { getExtensionForFormat } from '../../../src/transformers/reportGenerator.js';
import { compareToBaselines } from '../../utils/baselineCompare.js';
import { postTestCleanup } from '../../utils/testCleanup.js';
import { preTestSetup } from '../../utils/testSetup.js';

describe('acc-transformer transform NUTs', () => {
  let session: TestSession;
  const formatString = formatOptions.map((f) => `--format ${f}`).join(' ');

  beforeAll(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    await preTestSetup();
  });

  afterAll(async () => {
    await session?.clean();
    await postTestCleanup();
  });

  inputJsons.forEach(({ label, path }) => {
    it(`transforms the ${label} command JSON file into all formats`, async () => {
      const command = `acc-transformer transform --coverage-json "${path}" --output-report "${label}.xml" ${formatString} -i "samples"`;
      const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

      const expectedOutput =
        'The coverage report has been written to: ' +
        formatOptions
          .map((f) => {
            const ext = getExtensionForFormat(f);
            return `${label}-${f}${ext}`;
          })
          .join(', ');

      expect(output.replace('\n', '')).toStrictEqual(expectedOutput);
    });
  });

  it('confirm the reports created are the same as the baselines.', async () => {
    await compareToBaselines();
  });

  it('confirms a failure on an invalid JSON file.', async () => {
    const command = `acc-transformer transform --coverage-json "${invalidJson}"`;
    const error = execCmd(command, { ensureExitCode: 1 }).shellOutput.stderr;

    expect(error.replace('\n', '')).toContain(
      'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
    );
  });
});
