#!/bin/bash

# Check if servers are already running
if lsof -i :3000,3001 | grep -q LISTEN; then
    echo "✓ Development servers are already running"
    exit 0
fi

echo "Starting development servers..."
pnpm dev &
DEV_PID=$!

# Wait for servers to be ready
echo "Waiting for servers to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null && curl -s http://localhost:3000 > /dev/null; then
        echo "✓ Servers are ready!"
        echo "  - Web app: http://localhost:3001"
        echo "  - API server: http://localhost:3000"
        exit 0
    fi
    sleep 1
done

echo "⚠️  Servers failed to start after 30 seconds"
exit 1