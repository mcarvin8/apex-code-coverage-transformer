'use strict';
/* eslint-disable no-await-in-loop */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { findSubFolder } from './findSubFolder.js';
import { getPackageDirectories } from './getPackageDirectories.js';

export async function findFilePath(fileName: string, dxConfigFile: string): Promise<string | undefined> {
  const packageDirectories = await getPackageDirectories(dxConfigFile);

  let filePath: string | undefined;
  for (const directory of packageDirectories) {
    filePath = await findFilePathinDirectory(fileName, directory);
    if (filePath !== undefined) {
      break;
    }
  }
  return filePath;
}

async function findFilePathinDirectory(fileName: string, dxDirectory: string): Promise<string | undefined> {
  const fileExtension = fileName.split('.').slice(1).join('.');
  let relativeClassPath = await findSubFolder(dxDirectory, 'classes');
  let relativeTriggerPath = await findSubFolder(dxDirectory, 'triggers');
  let relativeFlowPath = await findSubFolder(dxDirectory, 'flows');
  let absoluteClassPath = '';
  let absoluteTriggerPath = '';
  let absoluteFlowPath = '';

  // if file extension is found, use that to determine paths
  if (fileExtension === 'cls' && relativeClassPath !== undefined) {
    absoluteClassPath = path.resolve(relativeClassPath, fileName);
    if (fs.existsSync(absoluteClassPath)) {
      return path.join(relativeClassPath, fileName);
    }
  } else if (fileExtension === 'trigger' && relativeTriggerPath !== undefined) {
    absoluteTriggerPath = path.resolve(relativeTriggerPath, fileName);
    if (fs.existsSync(absoluteTriggerPath)) {
      return path.join(relativeTriggerPath, fileName);
    }
  } else if (fileExtension === 'flow-meta.xml' && relativeFlowPath !== undefined) {
    absoluteFlowPath = path.resolve(relativeFlowPath, fileName);
    if (fs.existsSync(absoluteFlowPath)) {
      return path.join(relativeFlowPath, fileName);
    }
  }

  // if file extension is not found, add file extensions manually and test paths
  relativeClassPath = path.join(relativeClassPath, `${fileName}.cls`);
  relativeTriggerPath = path.join(relativeTriggerPath, `${fileName}.trigger`);
  relativeFlowPath = path.join(relativeFlowPath, `${fileName}.flow-meta.xml`);
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
