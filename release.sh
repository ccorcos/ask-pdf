#!/bin/bash

set -e

npm version patch

npm run clean
npm run build

cp README.md build
cp package.json build
cp src/* build

cd build
npm publish --access public
