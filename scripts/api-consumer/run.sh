#!/usr/bin/env bash
# Install apex-code-coverage-transformer into a fresh scratch project and check the
# programmatic API the way an external consumer would: types via `tsc`, runtime via node.
#
# Usage: scripts/api-consumer/run.sh <package-spec>
#   <package-spec> is anything `npm install` accepts, e.g.
#     ./apex-code-coverage-transformer-4.2.0.tgz        (pre-publish, from `npm pack`)
#     apex-code-coverage-transformer@4.2.0              (post-publish, from the registry)
set -euo pipefail

SPEC="${1:?usage: run.sh <package-spec>}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/scripts/api-consumer"
FIXTURES="$REPO_ROOT/test/fixtures"

# Resolve a local tarball to an absolute path before leaving the repo.
if [[ -f "$SPEC" ]]; then
  SPEC="$(cd "$(dirname "$SPEC")" && pwd)/$(basename "$SPEC")"
fi

WORK="$(mktemp -d)"
trap 'rm -rf "${WORK:?}"' EXIT
echo "Consumer project: $WORK"
echo "Installing: $SPEC"

cd "$WORK"
echo '{ "name": "api-consumer", "private": true, "type": "module" }' > package.json
npm install --no-audit --no-fund --loglevel=error "$SPEC" typescript @types/node
cp "$HERE/check.mjs" "$HERE/types.ts" "$HERE/tsconfig.json" .

# Minimal SFDX project from the shared fixtures, so file paths actually resolve.
mkdir -p project/force-app
cp -r "$FIXTURES/samples/." project/force-app/
echo '{ "packageDirectories": [{ "path": "force-app", "default": true }] }' > project/sfdx-project.json

echo "Installed version: $(node -p "require('apex-code-coverage-transformer/package.json').version")"

echo "--- Type check"
npx --no-install tsc -p tsconfig.json
echo "ok - published types compile"

echo "--- Runtime check"
node check.mjs "$WORK/project" \
  "$FIXTURES/inputs/deploy_coverage.json" \
  "$FIXTURES/inputs/test_coverage.json" \
  "$FIXTURES/inputs/invalid.json"
