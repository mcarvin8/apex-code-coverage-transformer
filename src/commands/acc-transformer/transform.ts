'use strict';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { TransformerTransformResult } from '../../utils/types.js';
import { transformCoverageReport } from '../../transformers/coverageTransformer.js';
import { formatOptions } from '../../utils/constants.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('apex-code-coverage-transformer', 'transformer.transform');

export default class TransformerTransform extends SfCommand<TransformerTransformResult> {
  public static override readonly summary = messages.getMessage('summary');
  public static override readonly description = messages.getMessage('description');
  public static override readonly examples = messages.getMessages('examples');

  public static override readonly flags = {
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
      required: false,
      multiple: true,
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
    const warnings: string[] = [];

    const result = await transformCoverageReport(
      flags['coverage-json'],
      flags['output-report'],
      flags['format'] ?? ['sonar'],
      flags['ignore-package-directory'] ?? []
    );
    warnings.push(...result.warnings);
    const finalPath = result.finalPaths;

    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }

    this.log(`The coverage report has been written to: ${finalPath.join(', ')}`);
    return { path: finalPath };
  }
}
