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
  const iterator = items[Symbol.iterator]();
  let active = 0;
  let done = false;

  return new Promise((resolve, reject) => {
    function next(): void {
      while (active < limit && !done) {
        const { value, done: iterDone } = iterator.next();
        if (iterDone) {
          done = true;
          if (active === 0) resolve();
          return;
        }
        active++;
        iteratee(value)
          .then(() => {
            active--;
            next();
            if (done && active === 0) resolve();
          })
          .catch(reject);
      }
    }
    next();
  });
}
