#!/bin/bash
cd /home/z/my-project/mini-services/tg-bot-service
while true; do
  echo "Starting tg-bot-service at $(date)" >> /tmp/tg-bot-service-daemon.log
  /usr/local/bin/bun --hot index.ts >> /tmp/tg-bot-service-daemon.log 2>&1
  EXIT_CODE=$?
  echo "Process exited with code $EXIT_CODE at $(date)" >> /tmp/tg-bot-service-daemon.log
  sleep 3
done
