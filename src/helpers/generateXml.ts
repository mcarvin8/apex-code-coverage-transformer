'use strict';

import { create } from 'xmlbuilder2';
import { SonarCoverageObject, CoberturaCoverageObject, CloverCoverageObject } from './types.js';

export function generateXml(
  coverageObj: SonarCoverageObject | CoberturaCoverageObject | CloverCoverageObject,
  format: string
): string {
  const isHeadless = format === 'cobertura' || format === 'clover';
  let xml = create(coverageObj).end({ prettyPrint: true, indent: '  ', headless: isHeadless });

  if (format === 'cobertura') {
    xml = `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
  } else if (format === 'clover') {
    xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }

  return xml;
}
