'use strict';

import { describe, expect, it } from 'vitest';

import TransformerTransform from '../../src/commands/acc-transformer/transform.js';
import { invalidJson } from '../utils/testConstants.js';

describe('transform command error output', () => {
  it('does not surface CoverageError codes, keeping CLI output as "Error (1): ..."', async () => {
    const error = (await TransformerTransform.run(['-j', invalidJson]).catch((e: unknown) => e)) as {
      code?: string;
      exitCode?: number;
      message: string;
    };

    expect(error.message).toContain('The provided JSON does not match a known coverage data format');
    expect(error.code).not.toBe('UNKNOWN_INPUT_FORMAT');
    expect(error.exitCode).toBe(1);
  });
});
