import { expect } from '@jest/globals';
import { checkCoverageDataType } from '../../../src/utils/setCoverageDataType.js';
import { DeployCoverageData } from '../../../src/utils/types.js';

describe('isSingleTestCoverageData - non-object element', () => {
  it('returns Unknown when a non-object is in the test coverage array', () => {
    const data = [123]; // Not an object

    const result = checkCoverageDataType(data as unknown as DeployCoverageData);
    expect(result).toStrictEqual('Unknown');
  });
});

describe('isDeployCoverageData - non-object', () => {
  it('returns Unknown when data is not an object', () => {
    const result = checkCoverageDataType(42 as unknown as DeployCoverageData); // 👈 non-object input
    expect(result).toStrictEqual('Unknown');
  });
});
