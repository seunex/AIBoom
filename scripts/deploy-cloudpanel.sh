#!/usr/bin/env bash
# Deploy Downstream on the CloudPanel Node site for aiboom.news.
# Run from the site htdocs directory, or set DEPLOY_PATH.
set -euo pipefail

APP_NAME="${APP_NAME:-aiboom}"
DEPLOY_PATH="${DEPLOY_PATH:-$(pwd)}"
PORT="${PORT:-3002}"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
fi
if ! command -v npm >/dev/null 2>&1; then
  for candidate in "$NVM_DIR"/versions/node/*/bin; do
    if [[ -x "$candidate/npm" ]]; then
      export PATH="$candidate:$PATH"
      break
    fi
  done
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "error: npm not found in PATH" >&2
  exit 1
fi

cd "$DEPLOY_PATH"

if [[ ! -f package.json ]]; then
  echo "error: no package.json in $DEPLOY_PATH" >&2
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building"
export SITE_URL="${SITE_URL:-https://aiboom.news}"
export PORT
npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2"
  npm install -g pm2
fi

echo "==> Reloading PM2 ($APP_NAME)"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  PORT="$PORT" SITE_URL="$SITE_URL" pm2 reload ecosystem.config.cjs --update-env
else
  PORT="$PORT" SITE_URL="$SITE_URL" pm2 start ecosystem.config.cjs
fi
pm2 save

echo "==> Waiting for http://127.0.0.1:${PORT}/"
ok=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS --max-time 3 "http://127.0.0.1:${PORT}/" >/dev/null; then
    ok=1
    break
  fi
  sleep 2
done
if [[ "$ok" -ne 1 ]]; then
  echo "error: the desk did not answer on port ${PORT}" >&2
  pm2 logs "$APP_NAME" --nostream --lines 40 || true
  exit 1
fi

echo "==> Deploy complete"
