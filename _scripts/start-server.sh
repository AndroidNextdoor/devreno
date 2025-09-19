#!/bin/bash

# /dev/reno Server Start Script

echo "Starting /dev/reno development server..."
echo "Environment: Development"

# Check if node_modules exists, install dependencies if not
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Function to find available port
find_port() {
    local port=${PORT:-5000}
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; do
        port=$((port + 1))
    done
    echo $port
}

# Set PORT if not already set
if [ -z "$PORT" ]; then
    export PORT=$(find_port)
    echo "Port 5000 in use, using port: $PORT"
else
    echo "Using port: $PORT"
fi

echo ""

# Start the server
node server.js