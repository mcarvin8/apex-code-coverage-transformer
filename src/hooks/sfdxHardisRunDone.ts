'use strict';

// Listens to the events sfdx-hardis sends as soon as Salesforce returns the result of a validation,
// a deployment or an Apex test run (declared under oclif.hooks in package.json). oclif only loads
// this file when sfdx-hardis fires one of them.
import {
  postPullRequestComment,
  type SfdxHardisEventHookOptions,
  type SfdxHardisRunEvent,
  uxLog,
} from 'sfdx-hardis/plugin-api';

import { handleSfdxHardisRunEvent, PLUGIN_NAME } from '../utils/sfdxHardisRunEvent.js';

const hook = async function (options: SfdxHardisEventHookOptions<SfdxHardisRunEvent>): Promise<void> {
  // A failing hook is only a warning for sfdx-hardis, but it must never break the run.
  try {
    const outcome = await handleSfdxHardisRunEvent(options, {
      postPullRequestComment,
      log: (message) => uxLog('log', null, `[${PLUGIN_NAME}] ${message}`),
      warn: (message) => uxLog('warning', null, `[${PLUGIN_NAME}] ${message}`),
    });
    if (!outcome.handled) {
      uxLog('log', null, `[${PLUGIN_NAME}] Skipped ${options.event}: ${outcome.reason}`);
    } else if (!outcome.comment.posted) {
      uxLog('log', null, `[${PLUGIN_NAME}] No Pull Request comment posted (${outcome.comment.reason ?? 'unknown'})`);
    }
  } catch (error) {
    uxLog('warning', null, `[${PLUGIN_NAME}] ${(error as Error).message}`);
  }
};

export default hook;
