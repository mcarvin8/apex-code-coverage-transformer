import { expect } from '@jest/globals';
import { checkCoverageDataType } from '../../src/utils/setCoverageDataType.js';
import { DeployCoverageData } from '../../src/utils/types.js';

describe('coverage type guard unit tests', () => {
  it('returns Unknown when a non-object is in the test coverage array', () => {
    const data = [123]; // Not an object

    const result = checkCoverageDataType(data as unknown as DeployCoverageData);
    expect(result).toStrictEqual('Unknown');
  });
  it('test where a statementMap has a non-object value.', async () => {
    const invalidDeployData = {
      'someFile.js': {
        path: 'someFile.js',
        fnMap: {},
        branchMap: {},
        f: {},
        b: {},
        s: {},
        statementMap: {
          someStatement: null,
        },
      },
    };

    const result = checkCoverageDataType(invalidDeployData as unknown as DeployCoverageData);
    expect(result).toStrictEqual('Unknown');
  });
  it('returns Unknown when data is not an object', () => {
    const result = checkCoverageDataType(42 as unknown as DeployCoverageData); // 👈 non-object input
    expect(result).toStrictEqual('Unknown');
  });
});
