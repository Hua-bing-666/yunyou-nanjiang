@echo off
echo ========================================
echo 云游南疆 - 本地演示环境启动脚本
echo ========================================
echo.

echo 1. 检查Node.js环境...
node --version
if errorlevel 1 (
    echo 错误: Node.js未安装或未添加到PATH
    pause
    exit /b 1
)

echo.
echo 2. 启动后端服务...
start cmd /k "cd /d %~dp0backend && echo [后端] 正在启动... && npm start"

echo.
echo 3. 等待后端启动（5秒）...
timeout /t 5 /nobreak > nul

echo.
echo 4. 启动前端服务...
start cmd /k "cd /d %~dp0my-travel && echo [前端] 正在启动... && npm run dev"

echo.
echo 5. 等待前端启动（3秒）...
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo ✅ 服务启动完成！
echo.
echo 访问地址:
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
echo.
echo 手机访问:
echo 1. 确保手机和电脑在同一Wi-Fi
echo 2. 在手机上访问: http://[电脑IP地址]:5173
echo 3. 获取电脑IP: 在命令行运行 ipconfig
echo ========================================
echo.
pause