@echo off
chcp 65001 >nul
title 云游南疆 - 前端演示启动脚本
color 0A

echo ========================================
echo    云游南疆 / 南疆旅游AI助手 v1.0
echo        前端展示版启动脚本
echo ========================================
echo.

:: 进入前端项目目录
cd my-travel

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    echo [提示] 如果安装速度较慢，可以按 Ctrl+C 取消后运行：
    echo        npm install --registry=https://registry.npmmirror.com
    echo.
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请手动运行：npm install
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成！
) else (
    echo [信息] 依赖已安装，跳过安装步骤
)

echo.
echo [信息] 正在启动前端开发服务器...
echo.
echo 访问地址：http://localhost:5173
echo.
echo ┌─────────────────────────────────────────┐
echo │  手机访问方式：                          │
echo │  1. 手机和电脑连接同一 Wi-Fi             │
echo │  2. 查看电脑 IP（运行 ipconfig 查看）    │
echo │  3. 手机浏览器访问 http://电脑IP:5173    │
echo └─────────────────────────────────────────┘
echo.
echo 按 Ctrl+C 停止服务
echo.

call npm run dev

pause
