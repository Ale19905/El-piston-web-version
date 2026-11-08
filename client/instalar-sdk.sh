#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p vendor
curl -fL "https://raw.githubusercontent.com/pocketbase/js-sdk/v0.28.1/dist/pocketbase.es.mjs" -o vendor/pocketbase.es.mjs
echo "SDK oficial de PocketBase v0.28.1 instalado en client/vendor/"
