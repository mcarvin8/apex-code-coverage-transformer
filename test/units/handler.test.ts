/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from '@jest/globals';

import { getCoverageHandler } from '../../src/handlers/getHandler.js';

describe('main', () => {
  it('confirms a failure with an invalid format.', async () => {
    try {
      getCoverageHandler('invalid');
      throw new Error('Command did not fail as expected');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('Unsupported format: invalid');
      } else {
        throw new Error('An unknown error type was thrown.');
      }
    }
  });
});
