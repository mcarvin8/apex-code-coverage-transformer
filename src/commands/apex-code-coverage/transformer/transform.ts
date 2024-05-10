'use strict';

import { resolve } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { DeployCoverageData, TestCoverageData } from '../../../helpers/types.js';
import { transformDeployCoverageReport } from '../../../helpers/transformDeployCoverageReport.js';
import { transformTestCoverageReport } from '../../../helpers/transformTestCoverageReport.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('apex-code-coverage-transformer', 'transformer.transform');

export type TransformerTransformResult = {
  path: string;
};

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
    xml: Flags.file({
      summary: messages.getMessage('flags.xml.summary'),
      char: 'x',
      required: true,
      exists: false,
      default: 'coverage.xml',
    }),
    command: Flags.string({
      summary: messages.getMessage('flags.command.summary'),
      char: 'c',
      required: true,
      default: 'deploy',
      options: ['deploy', 'test'],
    }),
  };

  public async run(): Promise<TransformerTransformResult> {
    const { flags } = await this.parse(TransformerTransform);
    const jsonFilePath = resolve(flags['coverage-json']);
    const xmlFilePath = resolve(flags['xml']);
    const commandType = flags['command'];
    const jsonData = await readFile(jsonFilePath, 'utf-8');

    let xmlData: string;
    let warnings: string[] = [];
    let filesProcessed: number = 0;
    if (commandType === 'test') {
      const coverageData = JSON.parse(jsonData) as TestCoverageData[];
      const result = await transformTestCoverageReport(coverageData);
      xmlData = result.xml;
      warnings = result.warnings;
      filesProcessed = result.filesProcessed;
    } else {
      const coverageData = JSON.parse(jsonData) as DeployCoverageData;
      const result = await transformDeployCoverageReport(coverageData);
      xmlData = result.xml;
      warnings = result.warnings;
      filesProcessed = result.filesProcessed;
    }

    // Print warnings if any
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }

    if (filesProcessed === 0) {
      this.error('None of the files listed in the coverage JSON were processed.');
    }

    await writeFile(xmlFilePath, xmlData);
    this.log(`The XML data has been written to ${xmlFilePath}`);
    return { path: xmlFilePath };
  }
}
