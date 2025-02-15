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
    }),
    'output-report': Flags.file({
      summary: messages.getMessage('flags.output-report.summary'),
      char: 'r',
      required: true,
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
    'ignore-package-directory': Flags.directory({
      summary: messages.getMessage('flags.ignore-package-directory.summary'),
      char: 'i',
      required: false,
      multiple: true,
    }),
  };

  public async run(): Promise<TransformerTransformResult> {
    const { flags } = await this.parse(TransformerTransform);
    const jsonFilePath = resolve(flags['coverage-json']);
    let outputReportPath = resolve(flags['output-report']);
    const ignoreDirs = flags['ignore-package-directory'] ?? [];
    const format = flags['format'];
    let jsonData: string;
    try {
      jsonData = await readFile(jsonFilePath, 'utf-8');
    } catch (error) {
      this.warn(`Failed to read ${jsonFilePath}. Confirm file exists.`);
      return { path: jsonFilePath };
    }

    let xmlData: string;
    let warnings: string[] = [];
    let filesProcessed: number = 0;
    const parsedData = JSON.parse(jsonData) as DeployCoverageData | TestCoverageData[];
    const commandType = checkCoverageDataType(parsedData);

    // Determine the type of coverage data using type guards
    if (commandType === 'TestCoverageData') {
      const result = await transformTestCoverageReport(parsedData as TestCoverageData[], format, ignoreDirs);
      xmlData = result.xml;
      warnings = result.warnings;
      filesProcessed = result.filesProcessed;
    } else if (commandType === 'DeployCoverageData') {
      const result = await transformDeployCoverageReport(parsedData as DeployCoverageData, format, ignoreDirs);
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

    // Adjust the output file extension if the format is lcovonly
    if (format === 'lcovonly' && !outputReportPath.endsWith('.info')) {
      outputReportPath = outputReportPath.replace(/\.xml$/, '.info'); // Replace .xml with .info if it exists
      if (!outputReportPath.endsWith('.info')) {
        outputReportPath += '.info'; // Ensure the extension is .info
      }
    }

    await writeFile(outputReportPath, xmlData);
    this.log(`The coverage report has been written to ${outputReportPath}`);
    return { path: outputReportPath };
  }
}
