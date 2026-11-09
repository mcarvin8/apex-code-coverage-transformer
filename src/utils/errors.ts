'use strict';

export type CoverageErrorCode = 'UNKNOWN_INPUT_FORMAT' | 'MIXED_INPUT_TYPES' | 'UNSUPPORTED_FORMAT' | 'NO_SFDX_PROJECT';

/**
 * Error thrown by the transformer for known failure cases.
 * Check `code` instead of matching on `message`.
 */
export class CoverageError extends Error {
  public readonly code: CoverageErrorCode;

  public constructor(message: string, options: { code: CoverageErrorCode; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = 'CoverageError';
    this.code = options.code;
  }
}
