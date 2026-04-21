import { HandlerRegistry } from '../handlers/HandlerRegistry.js';

// Import all handlers to ensure they're registered
import '../handlers/getHandler.js';
import { XmlHeaderConfig, XmlReportFormat } from './types.js';

/**
 * Get available coverage format options.
 * This dynamically retrieves all registered formats from the HandlerRegistry.
 */
export const formatOptions: string[] = HandlerRegistry.getAvailableFormats();
export const builderOptions = {
  commentPropName: '#comment',
  ignoreAttributes: false,
  ignoreNameSpace: false,
  parseTagValue: false,
  parseNodeValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: false,
  format: true,
  indentBy: '  ',
  suppressBooleanAttributes: false,
  suppressEmptyNode: true,
  attributeNamePrefix: '@',
};

export const XML_HEADER_CONFIG: Record<XmlReportFormat, XmlHeaderConfig> = {
  cobertura: {
    xmlDecl: '<?xml version="1.0" ?>',
    doctype: '<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">',
  },
  clover: {
    xmlDecl: '<?xml version="1.0" encoding="UTF-8"?>',
  },
  jacoco: {
    xmlDecl: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    doctype: '<!DOCTYPE report PUBLIC "-//JACOCO//DTD Report 1.0//EN" "report.dtd">',
  },
  opencover: {
    xmlDecl: '<?xml version="1.0" encoding="utf-8"?>',
  },
};
