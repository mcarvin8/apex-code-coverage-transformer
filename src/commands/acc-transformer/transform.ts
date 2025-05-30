'use strict';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { TransformerTransformResult } from '../../utils/types.js';
import { transformCoverageReport } from '../../transformers/coverageTransformer.js';
import { formatOptions } from '../../utils/constants.js';

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
    const jsonFilePath = flags['coverage-json'];
    const outputReportPath = flags['output-report'];
    const ignoreDirs = flags['ignore-package-directory'] ?? [];
    const format = flags['format'];
    let finalPath = outputReportPath;

    const warnings: string[] = [];

    try {
      const result = await transformCoverageReport(jsonFilePath, outputReportPath, format, ignoreDirs);
      warnings.push(...result.warnings);
      finalPath = result.finalPath;
    } catch (err) {
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

    this.log(`The coverage report has been written to ${finalPath}`);
    return { path: outputReportPath };
  }
}
