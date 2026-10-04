#!/usr/bin/env bash
# Captures version-management and build-environment evidence as real command output.
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$ROOT/docs/review3/evidence/logs"
cd "$ROOT"
cap() { local name=$1; shift; { echo "\$ $*"; "$@" 2>&1; } > "$OUT/$name.txt"; }
cap 20-git-log-graph  git log --graph --decorate --format='%h %<(10,trunc)%an %ad %d %s' --date=short --all
cap 21-git-branches   git branch -a -vv
cap 22-git-tags       git tag -n
cap 23-git-shortlog   git shortlog -sn --all
{ echo '$ git log --oneline --no-merges | head -30'; git log --oneline --no-merges | head -30; echo; echo '$ git remote -v'; git remote -v; } > "$OUT/24-git-commits-remote.txt"
cap 25-ci-workflow    sed -n '1,200p' .github/workflows/ci.yml
{ echo '$ docker-compose -p finedgeda3 ps'; docker-compose -p finedgeda3 ps 2>&1; } > "$OUT/26-docker-compose-ps.txt"
{ echo '$ (cd backend && node -p "Object.entries({...require(./package.json).dependencies,...require(./package.json).devDependencies})")'; node -e "const p=require('./backend/package.json');console.log('backend dependencies');for(const[k,v]of Object.entries(p.dependencies))console.log('  '+k+' '+v);console.log('backend devDependencies');for(const[k,v]of Object.entries(p.devDependencies))console.log('  '+k+' '+v)"; node -e "const p=require('./frontend/package.json');console.log('frontend dependencies');for(const[k,v]of Object.entries(p.dependencies))console.log('  '+k+' '+v);console.log('frontend devDependencies');for(const[k,v]of Object.entries(p.devDependencies))console.log('  '+k+' '+v)"; } > "$OUT/27-dependencies.txt"
echo captured
