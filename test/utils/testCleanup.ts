/* eslint-disable no-await-in-loop */
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { formatOptions } from '../../src/utils/constants.js';
import { getExtensionForFormat } from '../../src/transformers/reportGenerator.js';
import { sfdxConfigFile, inputJsons, defaultPath } from './testConstants.js';

export async function postTestCleanup(): Promise<void> {
  await rm(sfdxConfigFile);
  await rm('force-app/main/default/classes/AccountProfile.cls');
  await rm('packaged/triggers/AccountTrigger.trigger');
  await rm('force-app', { recursive: true });
  await rm('packaged', { recursive: true });

  const pathsToRemove = formatOptions
    .flatMap((format) =>
      inputJsons.map(({ label }) => {
        const reportExtension = getExtensionForFormat(format);
        return resolve(`${format}_${label}${reportExtension}`);
      })
    )
    .concat(defaultPath);

  for (const path of pathsToRemove) {
    await rm(path).catch(() => {});
  }
}
