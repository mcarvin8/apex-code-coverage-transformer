'use strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function findFilePath(fileName: string, dxDirectory: string): string | undefined {
  const fileExtension = fileName.split('.').slice(1).join('.');
  let relativeClassPath = '';
  let relativeTriggerPath = '';
  let relativeFlowPath = '';
  let absoluteClassPath = '';
  let absoluteTriggerPath = '';
  let absoluteFlowPath = '';

  // if file extension is found, use that to determine paths
  if (fileExtension === 'cls') {
    relativeClassPath = `${dxDirectory}/classes/${fileName}`;
    absoluteClassPath = path.resolve(relativeClassPath);
    if (fs.existsSync(absoluteClassPath)) {
      return relativeClassPath;
    }
  } else if (fileExtension === 'trigger') {
    relativeTriggerPath = `${dxDirectory}/triggers/${fileName}`;
    absoluteTriggerPath = path.resolve(relativeTriggerPath);
    if (fs.existsSync(absoluteTriggerPath)) {
      return relativeTriggerPath;
    }
  } else if (fileExtension === 'flow-meta.xml') {
    relativeFlowPath = `${dxDirectory}/flows/${fileName}`;
    absoluteFlowPath = path.resolve(relativeFlowPath);
    if (fs.existsSync(absoluteFlowPath)) {
      return relativeFlowPath;
    }
  }

  // if file extension is not found, add file extensions manually and test paths
  relativeClassPath = `${dxDirectory}/classes/${fileName}.cls`;
  relativeTriggerPath = `${dxDirectory}/triggers/${fileName}.trigger`;
  relativeFlowPath = `${dxDirectory}/flows/${fileName}.flow-meta.xml`;
  absoluteClassPath = path.resolve(relativeClassPath);
  absoluteTriggerPath = path.resolve(relativeTriggerPath);
  absoluteFlowPath = path.resolve(relativeFlowPath);
  if (fs.existsSync(absoluteClassPath)) {
    return relativeClassPath;
  } else if (fs.existsSync(absoluteTriggerPath)) {
    return relativeTriggerPath;
  } else if (fs.existsSync(absoluteFlowPath)) {
    return relativeFlowPath;
  }
  return undefined;
}
