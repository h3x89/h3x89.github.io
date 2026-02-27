#!/bin/bash
# Copyright 2020 Nordcloud Oy or its affiliates. All Rights Reserved.
set -euo pipefail

echo "Checking if package.json exists"
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found"
    exit 1
fi

echo "Installing dependencies"
npm ci || npm install

echo "Running probot settings"
if [ -f ".github/run-probot-receive.mjs" ]; then
    node .github/run-probot-receive.mjs
else
    echo "Error: probot runner script not found"
    exit 1
fi

echo "Settings updated successfully"
