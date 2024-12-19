'use strict';

import { create } from 'xmlbuilder2';
import { SonarCoverageObject, CoberturaCoverageObject } from './types.js';

export function generateXml(coverageObj: SonarCoverageObject | CoberturaCoverageObject, format: string): string {
  let xml = create(coverageObj).end({ prettyPrint: true, indent: '  ', headless: format === 'cobertura' });

  if (format === 'cobertura') {
    xml = `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
  }

  return xml;
}
