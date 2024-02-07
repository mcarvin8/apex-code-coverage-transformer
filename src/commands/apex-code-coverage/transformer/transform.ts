'use strict';
import * as fs from 'node:fs';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { CoverageData } from '../../../helpers/types.js';

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
    'json': Flags.string({
      summary: messages.getMessage('flags.json.summary'),
      char: 'j',
      required: true,
      exists: true,
    }),
    'xml': Flags.string({
      summary: messages.getMessage('flags.xml.summary'),
      char: 'x',
      required: true,
      exists: false,
      default: 'coverage.xml',
    }),
  };

  public async run(): Promise<TransformerTransformResult> {
    const { flags } = await this.parse(TransformerTransform);
    const jsonFilePath = flags['json'];
    const xmlFilePath = flags['xml'];
    const dxDirectory = flags['dx-directory'];

    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    const coverageData = JSON.parse(jsonData) as CoverageData;
    const xmlData = convertToGenericTestReport(coverageData, dxDirectory);

    // Write the XML data to the XML file
    try {
      fs.writeFileSync(xmlFilePath as string, xmlData);
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.log(`The XML data has been written to ${xmlFilePath}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.error(`Error writing XML data to file: ${error}`);
    }

    return { path: xmlFilePath };
  }
}

function convertToGenericTestReport(data: CoverageData, dxDirectory: string): string {
  let xml = '<?xml version="1.0"?>\n<coverage version="1">\n';

  for (const className in data) {
      if (Object.prototype.hasOwnProperty.call(data, className)) {
          const classInfo = data[className];
          const formattedClassName = className.replace('no-map/', '');
          const classPath = `${dxDirectory}/classes/${formattedClassName}.cls`;
          xml += `\t<file path="${classPath}">\n`;

          for (const lineNumber in classInfo.s) {
              if (Object.prototype.hasOwnProperty.call(classInfo.s, lineNumber)) {
                  const count = classInfo.s[lineNumber];
                  const covered = count > 0 ? 'true' : 'false';
                  // only add uncovered lines
                  if (covered === 'false') {
                      xml += `\t\t<lineToCover lineNumber="${lineNumber}" covered="${covered}"/>\n`;
                  }
              }
          }
          xml += '\t</file>\n';
      }
  }
  xml += '</coverage>';
  return xml;
}
