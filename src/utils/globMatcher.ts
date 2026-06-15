import { basename } from 'node:path';

type CharClassResult = { cls: string; nextIndex: number };

function parseCharClass(pattern: string, start: number): CharClassResult {
  let j = start + 1;
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
    return { cls: cls + ']', nextIndex: j + 1 };
  }
  // unmatched '[', treat as literal
  return { cls: '\\[', nextIndex: start + 1 };
}

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
      const { cls, nextIndex } = parseCharClass(pattern, i);
      re += cls;
      i = nextIndex;
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
