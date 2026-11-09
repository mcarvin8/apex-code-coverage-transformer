#!/usr/bin/env bash
# Install apex-code-coverage-transformer (the CLI plugin package) or
# apex-code-coverage-transformer-core (the dependency-free API package) into a fresh scratch
# project and check the programmatic API the way an external consumer would: types via `tsc`,
# runtime via node.
#
# Usage: scripts/api-consumer/run.sh <package-spec>
#   <package-spec> is a local tarball or a registry spec, e.g.
#     ./apex-code-coverage-transformer-4.2.0.tgz          (pre-publish, from `npm pack`)
#     apex-code-coverage-transformer@4.2.0                (post-publish, from the registry)
#     apex-code-coverage-transformer-core@4.2.0
#
# Either package is installed under the name "apex-code-coverage-transformer" (an npm alias),
# so check.mjs and types.ts import the same name for both.
set -euo pipefail

SPEC="${1:?usage: run.sh <package-spec>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/scripts/api-consumer"
FIXTURES="$REPO_ROOT/test/fixtures"
ALIAS="apex-code-coverage-transformer"

if [[ -f "$SPEC" ]]; then
  # Resolve a local tarball to an absolute path before leaving the repo. On Windows (Git Bash),
  # `pwd -W` gives a native path; Git Bash doesn't translate a POSIX path inside "name@file:...".
  TARBALL_DIR="$(cd "$(dirname "$SPEC")" && (pwd -W 2>/dev/null || pwd))"
  SPEC="$ALIAS@file:$TARBALL_DIR/$(basename "$SPEC")"
elif [[ "${SPEC%@*}" != "$ALIAS" ]]; then
  SPEC="$ALIAS@npm:$SPEC"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "${WORK:?}"' EXIT
echo "Consumer project: $WORK"
echo "Installing: $SPEC"

cd "$WORK"
echo '{ "name": "api-consumer", "private": true, "type": "module" }' >package.json
npm install --no-audit --no-fund --loglevel=error "$SPEC" typescript @types/node
cp "$HERE/check.mjs" "$HERE/types.ts" "$HERE/tsconfig.json" .

# Minimal SFDX project from the shared fixtures, so file paths actually resolve.
mkdir -p project/force-app
cp -r "$FIXTURES/samples/." project/force-app/
echo '{ "packageDirectories": [{ "path": "force-app", "default": true }] }' >project/sfdx-project.json

INSTALLED_NAME="$(node -p "require('$ALIAS/package.json').name")"
echo "Installed: $INSTALLED_NAME@$(node -p "require('$ALIAS/package.json').version")"

if [[ "$INSTALLED_NAME" == "$ALIAS-core" ]]; then
  echo "--- Dependency check"
  DEPENDENCIES="$(node -p "Object.keys(require('$ALIAS/package.json').dependencies ?? {}).join(', ')")"
  if [[ -n "$DEPENDENCIES" ]]; then
    echo "$INSTALLED_NAME must have no runtime dependencies, found: $DEPENDENCIES"
    exit 1
  fi
  echo "ok - no runtime dependencies"
fi

echo "--- Type check"
npx --no-install tsc -p tsconfig.json
echo "ok - published types compile"

echo "--- Runtime check"
node check.mjs "$WORK/project" \
  "$FIXTURES/inputs/deploy_coverage.json" \
  "$FIXTURES/inputs/test_coverage.json" \
  "$FIXTURES/inputs/invalid.json"
