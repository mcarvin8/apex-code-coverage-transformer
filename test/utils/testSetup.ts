/* eslint-disable no-await-in-loop */
import { mkdir, copyFile, writeFile } from 'node:fs/promises';

import { sfdxConfigFile, baselineClassPath, baselineTriggerPath, configJsonString } from './testConstants.js';

export async function preTestSetup(): Promise<void> {
  await mkdir('force-app/main/default/classes', { recursive: true });
  await mkdir('packaged/triggers', { recursive: true });
  await copyFile(baselineClassPath, 'force-app/main/default/classes/AccountProfile.cls');
  await copyFile(baselineTriggerPath, 'packaged/triggers/AccountTrigger.trigger');
  await writeFile(sfdxConfigFile, configJsonString);
}
