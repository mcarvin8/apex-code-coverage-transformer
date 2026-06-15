import { basename } from 'node:path';

type TokenResult = { fragment: string; advance: number };

function parseCharClass(pattern: string, start: number): TokenResult {
  let j = start + 1;
  let cls = '[';

  // Stryker disable next-line ConditionalExpression,EqualityOperator -- equivalent mutant: undefined !== '!' so bounds check is undetectable via char comparison
  if (j < pattern.length && pattern[j] === '!') {
    cls += '^';
    j++;
  }
  // Stryker disable next-line ConditionalExpression,EqualityOperator -- equivalent mutant: undefined !== ']' so bounds check is undetectable via char comparison
  if (j < pattern.length && pattern[j] === ']') {
    cls += '\\]';
    j++;
  }
  // Stryker disable next-line EqualityOperator -- equivalent mutant: extra iteration appends undefined to cls but unmatched-[ path still returns \\[
  while (j < pattern.length && pattern[j] !== ']') {
    cls += pattern[j++];
  }
  if (j < pattern.length) {
    return { fragment: cls + ']', advance: j + 1 - start };
  }
  // unmatched '[', treat as literal
  return { fragment: '\\[', advance: 1 };
}

function parseDoubleStar(pattern: string, i: number): TokenResult {
  if (pattern[i + 2] === '/') {
    return { fragment: '(.*\\/)?', advance: 3 };
  }
  return { fragment: '.*', advance: 2 };
}

function nextToken(pattern: string, i: number): TokenResult {
  const c = pattern[i];
  if (c === '*' && pattern[i + 1] === '*') return parseDoubleStar(pattern, i);
  if (c === '*') return { fragment: '[^/]*', advance: 1 };
  if (c === '?') return { fragment: '[^/]', advance: 1 };
  if (c === '[') return parseCharClass(pattern, i);
  return { fragment: c.replace(/[.+^${}()|\\]/g, '\\$&'), advance: 1 };
}

function globToRegex(pattern: string): RegExp {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    const { fragment, advance } = nextToken(pattern, i);
    re += fragment;
    i += advance;
  }
  return new RegExp('^' + re + '$');
}

export function matchesGlob(filePath: string, pattern: string, options?: { matchBase?: boolean }): boolean {
  const subject = options?.matchBase && !pattern.includes('/') ? basename(filePath) : filePath;
  return globToRegex(pattern).test(subject);
}
