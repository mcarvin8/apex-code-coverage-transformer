#!/usr/bin/env node
// Guards the apex-code-coverage-transformer-core package after `npm run build:core`:
// - it declares no runtime dependencies,
// - its build contains no CLI plugin, hook or GitHub Action code,
// - nothing in the build imports a package other than Node.js built-ins.
// Fails with a list of problems so a change that couples the core to oclif, the Salesforce
// libraries or @actions/core is caught before publish.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkgDir = 'packages/core';
const libDir = join(pkgDir, 'lib');
const problems = [];

const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'));
for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  if (pkg[field] && Object.keys(pkg[field]).length > 0) {
    problems.push(`package.json declares ${field}: ${Object.keys(pkg[field]).join(', ')}`);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

let files;
try {
  files = walk(libDir);
} catch {
  problems.push(`${libDir} is missing - run "npm run build:core" first`);
  files = [];
}

for (const dir of ['commands', 'hooks', 'action']) {
  if (files.some((f) => relative(libDir, f).split(/[\\/]/)[0] === dir)) {
    problems.push(`build contains plugin-only directory lib/${dir}`);
  }
}

const importPattern = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
for (const file of files.filter((f) => f.endsWith('.js'))) {
  for (const [, specifier] of readFileSync(file, 'utf-8').matchAll(importPattern)) {
    if (!specifier.startsWith('.') && !specifier.startsWith('node:')) {
      problems.push(`${relative(pkgDir, file)} imports "${specifier}"`);
    }
  }
}

if (problems.length > 0) {
  console.error(`apex-code-coverage-transformer-core check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`apex-code-coverage-transformer-core OK: ${files.length} files, no runtime dependencies`);
