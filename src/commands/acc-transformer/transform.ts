'use strict';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { TransformerTransformResult } from '../../utils/types.js';
import { transformCoverageReport } from '../../transformers/coverageTransformer.js';
import { formatOptions } from '../../utils/constants.js';
import { DEFAULT_MAX_ANNOTATIONS } from '../../transformers/generators/generateGitHubActions.js';

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
    // eslint-disable-next-line sf-plugin/flag-min-max-default
    'min-coverage': Flags.integer({
      summary: messages.getMessage('flags.min-coverage.summary'),
      required: false,
      min: 0,
      max: 100,
    }),
    'max-annotations': Flags.integer({
      summary: messages.getMessage('flags.max-annotations.summary'),
      required: false,
      min: 1,
      default: DEFAULT_MAX_ANNOTATIONS,
    }),
    'exclude-pattern': Flags.string({
      summary: messages.getMessage('flags.exclude-pattern.summary'),
      char: 'e',
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
      flags['ignore-package-directory'] ?? [],
      {
        minCoverage: flags['min-coverage'],
        maxAnnotations: flags['max-annotations'],
        excludePatterns: flags['exclude-pattern'],
      },
    );
    warnings.push(...result.warnings);

    this.log(`The coverage report has been written to: ${result.finalPaths.join(', ')}`);

    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }

    return { path: result.finalPaths };
  }
}
