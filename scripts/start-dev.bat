@echo off
chcp 65001 >nul
title 云游南疆
cd /d "%~dp0..\my-travel"
if not exist "node_modules\vite" (
  call npm ci
  if errorlevel 1 exit /b 1
)
call npm run dev
