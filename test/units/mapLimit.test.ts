import { describe, expect, it } from 'vitest';
import { mapLimit } from '../../src/utils/mapLimit.js';

describe('mapLimit', () => {
  it('processes all items with the requested concurrency', async () => {
    const items = [1, 2, 3, 4];
    const concurrency = 2;
    const activeStates: number[] = [];
    let active = 0;
    const processed: number[] = [];

    await mapLimit(items, concurrency, async (item) => {
      activeStates.push(++active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      processed.push(item);
      active--;
    });

    expect(Math.max(...activeStates)).toBeLessThanOrEqual(concurrency);
    expect(processed.sort((a, b) => a - b)).toEqual(items);
  });

  it('resolves immediately when there are no items', async () => {
    await expect(mapLimit([], 2, async () => undefined)).resolves.toBeUndefined();
  });

  it('rejects when an iteratee throws an error', async () => {
    await expect(
      mapLimit([1, 2, 3], 2, async (item) => {
        if (item === 2) {
          throw new Error('boom');
        }
      }),
    ).rejects.toThrow('boom');
  });

  it('treats a non-positive limit as a concurrency of 1', async () => {
    const values: number[] = [];
    await mapLimit([10, 20, 30], 0, async (item) => {
      values.push(item);
    });
    expect(values).toEqual([10, 20, 30]);
  });
});
