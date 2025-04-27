#!/bin/bash
git add .
git commit -m "Deploying changes"
git push
npm install
pm2 restart server.js
