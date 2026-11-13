'use strict';

import { Hook } from '@oclif/core';

import { markSfdxHardisParent } from '../utils/hookConfig.js';

// Flag sfdx-hardis commands so the `sf` commands they start skip the `finally` hook.
export const hook: Hook<'prerun'> = async function (options) {
  markSfdxHardisParent(options?.Command?.id ?? '');
};
