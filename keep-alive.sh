#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting server at $(date)" >> /tmp/piaoshu-server.log
  npx next dev -p 3000 >> /tmp/piaoshu-server.log 2>&1
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE at $(date)" >> /tmp/piaoshu-server.log
  sleep 3
done
