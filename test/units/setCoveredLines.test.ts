import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setCoveredLines } from '../../src/utils/setCoveredLines.js';

const mockGetTotalLines = vi.fn();

vi.mock('../../src/utils/getTotalLines.js', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  getTotalLines: (...args: unknown[]) => mockGetTotalLines(...args),
}));

describe('setCoveredLines unit test', () => {
  beforeEach(() => {
    mockGetTotalLines.mockReset();
  });

  it('renumbers out-of-range covered lines into available unused lines', async () => {
    mockGetTotalLines.mockResolvedValue(3);
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

  it('skips already-used line numbers when remapping multiple out-of-range covered lines', async () => {
    mockGetTotalLines.mockResolvedValue(3);

    // Line 1 is in-range and consumes slot 1. Lines 8 and 9 are out-of-range
    // and must be remapped. When remapping line 8 the inner loop hits
    // `usedLines.has(1)` (true) before settling on slot 2 — this exercises
    // the truthy branch of `!usedLines.has(randomLine)`.
    const inputLines = {
      '1': 1,
      '8': 1,
      '9': 1,
    };

    const result = await setCoveredLines('some/file.cls', '/repo', inputLines);

    expect(result).toEqual({
      '1': 1,
      '2': 1,
      '3': 1,
    });
  });

  it('returns { updatedLines, sourceContent } when returnSourceContent is true', async () => {
    const fileContent = 'line1\nline2\nline3\n';
    mockGetTotalLines.mockResolvedValue({ totalLines: 3, content: fileContent });

    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1, '2': 0 }, true);

    expect(result).toEqual({
      updatedLines: { '1': 1, '2': 0 },
      sourceContent: fileContent,
    });
  });
});
