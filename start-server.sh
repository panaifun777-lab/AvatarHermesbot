#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev -p 3000 &
  SERVER_PID=$!
  # Wait for it to start
  sleep 8
  # Keep checking if it's alive
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 10
  done
  echo "Server died, restarting..."
  sleep 2
done
