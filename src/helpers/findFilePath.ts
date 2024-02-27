'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function findFilePath(className: string, dxDirectory: string): string | null {
  const relativeClassPath = `${dxDirectory}/classes/${className}.cls`;
  const relativeTriggerPath = `${dxDirectory}/triggers/${className}.trigger`;
  const relativeFlowPath = `${dxDirectory}/flows/${className}.flow-meta.xml`;

  const absoluteClassPath = path.resolve(relativeClassPath);
  const absoluteTriggerPath = path.resolve(relativeTriggerPath);
  const absoluteFlowPath = path.resolve(relativeFlowPath);
  if (fs.existsSync(absoluteClassPath)) {
    return relativeClassPath;
  } else if (fs.existsSync(absoluteTriggerPath)) {
    return relativeTriggerPath;
  } else if (fs.existsSync(absoluteFlowPath)) {
    return relativeFlowPath;
  } else {
    throw Error(`The file name ${className} was not found in the classes, triggers, or flows directory.`);
  }
}
