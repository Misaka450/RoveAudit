#!/bin/bash
cd /opt/RoveAudit/backend
export $(grep -v '^#' .env | grep -v '^$' | xargs)
node dist/main.js > /tmp/backend.log 2>&1
