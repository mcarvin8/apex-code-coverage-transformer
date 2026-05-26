'use strict';

/**
 * Process an array concurrently with a maximum concurrency limit.
 * Drop-in replacement for the `async` package's `mapLimit`.
 *
 * @param items     - Items to process
 * @param limit     - Max number of concurrent tasks
 * @param iteratee  - Async function to run for each item
 */
export async function mapLimit<T>(items: T[], limit: number, iteratee: (item: T) => Promise<void>): Promise<void> {
  const concurrency = Math.max(1, limit);
  const queue = items.slice();
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      // eslint-disable-next-line no-await-in-loop
      await iteratee(item);
    }
  });

  await Promise.all(workers);
}
