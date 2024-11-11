#!/bin/bash

set -e

npm version patch

npm run clean
npm run build

cp README.md build
cp package.json build
cp pdf2md build
cp pdf2png build

cd build
npm publish
