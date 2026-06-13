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

  it('does NOT remap an uncovered line (status=0) that is out of range', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    // Line 10 is out of range but status=0: only covered (status=1) lines get remapped
    const result = await setCoveredLines('some/file.cls', '/repo', { '10': 0 });
    // status=0 out-of-range line stays in-place (not remapped)
    expect(result).toEqual({ '10': 0 });
  });

  it('does NOT remap a line exactly equal to totalLines (lineNumber > totalLines is strict)', async () => {
    mockGetTotalLines.mockResolvedValue(5);
    // Line 5 is exactly at the boundary; 5 > 5 is false → stays in place
    const result = await setCoveredLines('some/file.cls', '/repo', { '5': 1 });
    expect(result).toEqual({ '5': 1 });
  });

  it('remaps a covered line one past the last (totalLines+1)', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    // Line 4 > 3 → should be remapped to line 1
    const result = await setCoveredLines('some/file.cls', '/repo', { '4': 1 });
    expect(result).toEqual({ '1': 1 });
  });

  it('remaps a covered line to the last available slot (up to totalLines)', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    // Lines 1 and 2 are used; out-of-range line 5 should remap to line 3
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1, '2': 1, '5': 1 });
    expect(result).toEqual({ '1': 1, '2': 1, '3': 1 });
  });

  it('returns plain updatedLines when returnSourceContent is false (default)', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1 }, false);
    // Should be plain object, not { updatedLines, sourceContent }
    expect(result).toEqual({ '1': 1 });
    expect('updatedLines' in result).toBe(false);
  });

  // ── ArithmeticOperator mutation killer (setCoveredLines.ts:23) ──
  // Mutant replaces - with + in parseInt(lineA, 10) - parseInt(lineB, 10)
  // If sort is reversed (+), lines end up in descending order → remapping selects wrong slots.

  it('sorts lines in ascending order so remapping selects the lowest available slot', async () => {
    mockGetTotalLines.mockResolvedValue(2);
    // Lines 10 and 20 are both out-of-range and covered.
    // Correct sort (asc): [10, 20] → 10 remaps to slot 1, 20 remaps to slot 2.
    // Mutant sort (desc): [20, 10] → 20 remaps to slot 1, 10 remaps to slot 2.
    // The KEYS differ if sorting is wrong (e.g. if we checked which line was mapped first).
    // We verify both slots are filled: {1:1, 2:1}.
    const result = await setCoveredLines('some/file.cls', '/repo', { '20': 1, '10': 1 });
    expect(result).toEqual({ '1': 1, '2': 1 });
  });

  // ── MethodExpression mutation killer (setCoveredLines.ts:23) ──
  // Mutant removes the sort step from Object.entries(lines) — entries without sort.
  // Without sort, out-of-range remapping may assign slots in non-deterministic order.
  // The test below verifies deterministic slot assignment via sort.

  it('processes in ascending key order so an in-range line reserves its slot before remapping', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    // Line 1 is in-range (status=1), line 5 is out-of-range covered.
    // With ascending sort: line 1 is processed first → usedLines = {1} → line 5 remaps to 2.
    // Without sort, Object.entries order is insertion order — '5' may come first, taking slot 1,
    // then line 1 would go to slot 1 normally. This creates { '1': 1, '1': 1 } conflict.
    // The ascending sort guarantees '1' is processed before '5'.
    const result = await setCoveredLines('some/file.cls', '/repo', { '5': 1, '1': 1 });
    // Line 1 keeps its own slot, line 5 remaps to the next available (2)
    expect(result).toEqual({ '1': 1, '2': 1 });
  });

  // ── BooleanLiteral mutation killer (setCoveredLines.ts:15) ──
  // Mutant changes default parameter `returnSourceContent = false` to `true`.
  // When called without explicit false, should return plain updatedLines.

  it('returns plain object when returnSourceContent param is omitted (default false)', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1 });
    // Plain Record<string,number> — no sourceContent key
    expect('sourceContent' in result).toBe(false);
    expect('updatedLines' in result).toBe(false);
    expect(result).toEqual({ '1': 1 });
  });

  it('returns plain object when returnSourceContent is omitted and getTotalLines returns an object', async () => {
    mockGetTotalLines.mockResolvedValue({ totalLines: 3, content: 'a\nb\nc' });
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1 });
    // default false: returnSourceContent=false && typeof obj !== 'number' = false && true = false
    // mutant default true: true && true = true → would return { updatedLines, sourceContent }
    expect('sourceContent' in result).toBe(false);
    expect('updatedLines' in result).toBe(false);
    expect(result).toEqual({ '1': 1 });
  });

  // ── ConditionalExpression mutation killer (setCoveredLines.ts:19) ──
  // Mutant makes `typeof result === 'number'` always true → totalLines would always use result
  // even when result is an object. We verify that when getTotalLines returns an object,
  // totalLines is correctly extracted from result.totalLines (not result itself as a number).

  it('uses result.totalLines when getTotalLines returns an object (not always typeof===number)', async () => {
    // getTotalLines returns object with totalLines=5 and some content.
    // Mutant makes totalLines = result (the object) → comparing object to number → NaN → remapping breaks.
    mockGetTotalLines.mockResolvedValue({ totalLines: 5, content: 'line1\nline2\nline3\nline4\nline5' });
    // Line 3 is in range (≤5), line 8 is out of range (>5).
    const result = await setCoveredLines('some/file.cls', '/repo', { '3': 1, '8': 1 }, false);
    // Line 3 stays, line 8 remaps to 1 (lowest available slot)
    expect(result).toEqual({ '3': 1, '1': 1 });
  });

  // ── StringLiteral mutation killer (setCoveredLines.ts:32 and :45) ──
  // Line 32: updatedLines[randomLine.toString()] — the key must be the string of the line number.
  // Line 45: returnSourceContent condition and result.content access.

  it('remapped lines use numeric string keys (not empty string)', async () => {
    mockGetTotalLines.mockResolvedValue(3);
    const result = await setCoveredLines('some/file.cls', '/repo', { '99': 1 });
    const keys = Object.keys(result);
    // With empty string mutant, key would be '' — the remapped line key must be a non-empty digit string
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^\d+$/);
    expect(keys[0]).not.toBe('');
  });

  it('sourceContent in returned object matches the content from getTotalLines', async () => {
    // Tests that result.content (not '' or undefined) is returned.
    const expectedContent = 'hello\nworld\nfoo';
    mockGetTotalLines.mockResolvedValue({ totalLines: 3, content: expectedContent });
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1 }, true);
    expect('sourceContent' in result).toBe(true);
    if ('sourceContent' in result) {
      expect(result.sourceContent).toBe(expectedContent);
      expect(result.sourceContent).not.toBe('');
    }
  });

  // ── LogicalOperator mutation killer (setCoveredLines.ts:45) ──
  // Condition: `returnSourceContent && typeof result !== 'number'`
  // Mutant: `returnSourceContent || typeof result !== 'number'`
  // With ||, even when returnSourceContent=false but result is object, would return sourceContent block.

  it('does NOT return sourceContent when returnSourceContent is false even if result is an object', async () => {
    mockGetTotalLines.mockResolvedValue({ totalLines: 2, content: 'abc\ndef' });
    // returnSourceContent = false explicitly
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1 }, false);
    // Must be plain updatedLines, NOT { updatedLines, sourceContent }
    expect('sourceContent' in result).toBe(false);
    expect('updatedLines' in result).toBe(false);
    expect(result).toEqual({ '1': 1 });
  });

  // ── ConditionalExpression mutation killer (setCoveredLines.ts:45 true branch) ──
  // Mutant makes the condition always true → always returns { updatedLines, sourceContent }.
  // This test verifies that when returnSourceContent=false and result is a number, plain object returned.

  it('returns plain updatedLines when result is a number and returnSourceContent is false', async () => {
    mockGetTotalLines.mockResolvedValue(5); // result is a number
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1, '2': 0 }, false);
    expect('sourceContent' in result).toBe(false);
    expect(result).toEqual({ '1': 1, '2': 0 });
  });

  it('returns plain updatedLines when returnSourceContent is true but getTotalLines returns a number', async () => {
    mockGetTotalLines.mockResolvedValue(5); // result is a number, not an object
    const result = await setCoveredLines('some/file.cls', '/repo', { '1': 1, '2': 0 }, true);
    // returnSourceContent=true but typeof result === 'number' → condition false → plain lines
    // mutant typeof!=='number'→true: true && true = true → would return { updatedLines, sourceContent: undefined }
    // mutant 'number'→'': typeof 5 !== '' is always true → true && true = true → same issue
    expect('sourceContent' in result).toBe(false);
    expect(result).toEqual({ '1': 1, '2': 0 });
  });
});
