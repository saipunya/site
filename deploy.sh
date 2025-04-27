#!/bin/bash

# ตรวจสอบสถานะของ Git
git status

# เพิ่มการเปลี่ยนแปลงทั้งหมด
git add .

# คอมมิตการเปลี่ยนแปลง
git commit -m "Deploying changes"

# ผลักดันการเปลี่ยนแปลงไปยังรีโมต repository
git push

# ติดตั้ง dependencies ใหม่
npm install

# รีสตาร์ทแอปผ่าน PM2
pm2 restart server.js
