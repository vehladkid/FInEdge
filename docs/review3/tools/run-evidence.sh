#!/usr/bin/env bash
# Runs the full pipeline from clean installs and saves each command's real output.
# Usage: docs/review3/tools/run-evidence.sh   (needs PostgreSQL on localhost:5433, see README)
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$ROOT/docs/review3/evidence/logs"
mkdir -p "$OUT"
export FORCE_COLOR=0 NO_COLOR=1
status=0
run() { # name dir command...
  local name=$1 dir=$2; shift 2
  echo "\$ (cd $dir && $*)" > "$OUT/$name.txt"
  ( cd "$ROOT/$dir" && "$@" ) >> "$OUT/$name.txt" 2>&1
  local code=$?
  echo "[exit code: $code]" >> "$OUT/$name.txt"
  printf '%-28s exit %s\n' "$name" "$code" | tee -a "$OUT/_summary.txt"
  [ $code -eq 0 ] || status=1
}
: > "$OUT/_summary.txt"
run 01-backend-npm-ci          backend  npm ci
run 02-backend-lint            backend  npm run lint
run 03-backend-unit            backend  npm run test:unit
run 04-backend-integration     backend  npm run test:integration
run 05-backend-coverage        backend  npx vitest run --config vitest.integration.config.js --coverage
run 05b-backend-unit-coverage backend  npx vitest run --config vitest.unit.config.js --coverage
run 06-backend-mutation        backend  npm run test:mutation
run 07-frontend-npm-ci         frontend npm ci
run 08-frontend-lint           frontend npm run lint
run 09-frontend-unit           frontend npm run test:unit
run 10-frontend-coverage       frontend npm run test:coverage
run 11-frontend-build          frontend npm run build
run 12-regression-e2e          frontend npm run test:regression -- --reporter=list
run 13-docker-build-backend    .        docker build -t finedge-backend ./backend
run 14-docker-build-frontend   .        docker build -t finedge-frontend ./frontend
exit $status
