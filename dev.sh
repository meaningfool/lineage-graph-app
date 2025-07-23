#!/bin/bash

echo "🚀 Starting development servers..."
echo "   Web: http://localhost:3001"
echo "   Server: http://localhost:3000"
echo ""

# Start server in background
echo "Starting tRPC server..."
pnpm dev:server &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start web in background
echo "Starting web app..."
pnpm dev:web &
WEB_PID=$!

echo ""
echo "✅ Both servers started!"
echo "   Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait 