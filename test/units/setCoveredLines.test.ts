import { setCoveredLines } from '../../src/utils/setCoveredLines.js';

// Mock getTotalLines to simulate a short file
jest.mock('../../src/utils/getTotalLines.js', () => ({
  getTotalLines: jest.fn(() => Promise.resolve(3)), // Pretend file has only 3 lines
}));

describe('setCoveredLines', () => {
  it('renumbers out-of-range covered lines into available unused lines', async () => {
    const filePath = 'some/file.cls';
    const repoRoot = '/repo';

    // Line 5 is out of range since getTotalLines returns 3
    const inputLines = {
      '5': 1,
    };

    const result = await setCoveredLines(filePath, repoRoot, inputLines);

    expect(result).toEqual({
      '1': 1, // Line 5 is remapped to first available line (1)
    });
  });
});
