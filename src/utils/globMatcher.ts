import { basename } from 'node:path';

function globToRegex(pattern: string): RegExp {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
        // **/ means "any directory prefix, including none"
        re += '(.*\\/)?';
        i += 3;
      } else {
        re += '.*';
        i += 2;
      }
    } else if (c === '*') {
      re += '[^/]*';
      i++;
    } else if (c === '?') {
      re += '[^/]';
      i++;
    } else if (c === '[') {
      let j = i + 1;
      let cls = '[';
      if (j < pattern.length && pattern[j] === '!') {
        cls += '^';
        j++;
      }
      if (j < pattern.length && pattern[j] === ']') {
        cls += '\\]';
        j++;
      }
      while (j < pattern.length && pattern[j] !== ']') {
        cls += pattern[j++];
      }
      if (j < pattern.length) {
        cls += ']';
        re += cls;
        i = j + 1;
      } else {
        // unmatched '[', treat as literal
        re += '\\[';
        i++;
      }
    } else {
      re += c.replace(/[.+^${}()|\\]/g, '\\$&');
      i++;
    }
  }
  return new RegExp('^' + re + '$');
}

export function matchesGlob(filePath: string, pattern: string, options?: { matchBase?: boolean }): boolean {
  const subject = options?.matchBase && !pattern.includes('/') ? basename(filePath) : filePath;
  return globToRegex(pattern).test(subject);
}
