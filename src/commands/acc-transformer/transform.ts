'use strict';

import { resolve } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { DeployCoverageData, TestCoverageData, TransformerTransformResult } from '../../helpers/types.js';
import { transformDeployCoverageReport } from '../../helpers/transformDeployCoverageReport.js';
import { transformTestCoverageReport } from '../../helpers/transformTestCoverageReport.js';
import { checkCoverageDataType } from '../../helpers/setCoverageDataType.js';
import { formatOptions } from '../../helpers/constants.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('apex-code-coverage-transformer', 'transformer.transform');

export default class TransformerTransform extends SfCommand<TransformerTransformResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'coverage-json': Flags.file({
      summary: messages.getMessage('flags.coverage-json.summary'),
      char: 'j',
      required: true,
      exists: true,
    }),
    'output-report': Flags.file({
      summary: messages.getMessage('flags.output-report.summary'),
      // eslint-disable-next-line sf-plugin/dash-o
      char: 'o',
      required: true,
      exists: false,
      default: 'coverage.xml',
    }),
    format: Flags.string({
      summary: messages.getMessage('flags.format.summary'),
      char: 'f',
      required: true,
      multiple: false,
      default: 'sonar',
      options: formatOptions,
    }),
  };

  public async run(): Promise<TransformerTransformResult> {
    const { flags } = await this.parse(TransformerTransform);
    const jsonFilePath = resolve(flags['coverage-json']);
    const xmlFilePath = resolve(flags['output-report']);
    const format = flags['format'];
    const jsonData = await readFile(jsonFilePath, 'utf-8');

    let xmlData: string;
    let warnings: string[] = [];
    let filesProcessed: number = 0;
    const parsedData = JSON.parse(jsonData) as DeployCoverageData | TestCoverageData[];
    const commandType = checkCoverageDataType(parsedData);

    // Determine the type of coverage data using type guards
    if (commandType === 'TestCoverageData') {
      const result = await transformTestCoverageReport(parsedData as TestCoverageData[], format);
      xmlData = result.xml;
      warnings = result.warnings;
      filesProcessed = result.filesProcessed;
    } else if (commandType === 'DeployCoverageData') {
      const result = await transformDeployCoverageReport(parsedData as DeployCoverageData, format);
      xmlData = result.xml;
      warnings = result.warnings;
      filesProcessed = result.filesProcessed;
    } else {
      this.error(
        'The provided JSON does not match a known coverage data format from the Salesforce deploy or test command.'
      );
    }

    // Print warnings if any
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }

    if (filesProcessed === 0) {
      this.warn('None of the files listed in the coverage JSON were processed. The coverage report will be empty.');
    }

    await writeFile(xmlFilePath, xmlData);
    this.log(`The coverage report has been written to ${xmlFilePath}`);
    return { path: xmlFilePath };
  }
}
