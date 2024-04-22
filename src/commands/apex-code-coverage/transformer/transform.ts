'use strict';

import { resolve } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { CoverageData } from '../../../helpers/types.js';
import { convertToGenericCoverageReport } from '../../../helpers/convertToGenericCoverageReport.js';

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
    'sfdx-configuration': Flags.file({
      summary: messages.getMessage('flags.sfdx-configuration.summary'),
      char: 'c',
      required: true,
      exists: true,
      default: 'sfdx-project.json',
    }),
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
  };

  public async run(): Promise<TransformerTransformResult> {
    const { flags } = await this.parse(TransformerTransform);
    const jsonFilePath = resolve(flags['coverage-json']);
    const xmlFilePath = resolve(flags['xml']);
    const sfdxConfigFile = resolve(flags['sfdx-configuration']);

    const jsonData = await readFile(jsonFilePath, 'utf-8');
    const coverageData = JSON.parse(jsonData) as CoverageData;
    const {
      xml: xmlData,
      warnings,
      filesProcessed,
    } = await convertToGenericCoverageReport(coverageData, sfdxConfigFile);

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
