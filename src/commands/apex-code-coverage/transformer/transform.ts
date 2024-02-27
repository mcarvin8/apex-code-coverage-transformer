'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
    'dx-directory': Flags.directory({
      summary: messages.getMessage('flags.dx-directory.summary'),
      char: 'd',
      required: true,
      exists: true,
      default: 'force-app/main/default',
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
    let jsonFilePath = flags['coverage-json'];
    let xmlFilePath = flags['xml'];
    const dxDirectory = flags['dx-directory'];
    jsonFilePath = path.resolve(jsonFilePath);
    xmlFilePath = path.resolve(xmlFilePath);
    // Check if the JSON file exists
    if (!fs.existsSync(jsonFilePath)) {
      this.error(`JSON file does not exist: ${jsonFilePath}`);
    }
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    const coverageData = JSON.parse(jsonData) as CoverageData;
    const xmlData = convertToGenericCoverageReport(coverageData, dxDirectory);

    // Write the XML data to the XML file
    try {
      fs.writeFileSync(xmlFilePath, xmlData);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.log(`The XML data has been written to ${xmlFilePath}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.error(`Error writing XML data to file: ${error}`);
    }

    return { path: xmlFilePath };
  }
}
