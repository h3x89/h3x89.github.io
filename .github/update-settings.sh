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
if [ -f "node_modules/.bin/probot" ]; then
    node_modules/.bin/probot receive -e repository.created -p "${GITHUB_EVENT_PATH}" node_modules/probot-settings/index.js
else
    echo "Error: probot binary not found"
    exit 1
fi

echo "Settings updated successfully"
