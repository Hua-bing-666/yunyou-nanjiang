@echo off
echo ========================================
echo  南疆旅游AI助手 - CloudBase部署助手
echo ========================================
echo.

echo [1/5] 检查项目配置...
if not exist "my-travel" (
    echo ❌ 错误：my-travel目录不存在
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ 错误：backend目录不存在
    pause
    exit /b 1
)

echo ✅ 项目目录检查通过
echo.

echo [2/5] 检查必要的配置文件...
if not exist "my-travel\package.json" (
    echo ❌ 错误：my-travel/package.json不存在
    pause
    exit /b 1
)

if not exist "backend\package.json" (
    echo ❌ 错误：backend/package.json不存在
    pause
    exit /b 1
)

echo ✅ 配置文件检查通过
echo.

echo [3/5] 显示部署步骤指南...
echo.
echo 📋 请按以下步骤完成CloudBase部署：
echo.
echo 第一步：获取CloudBase环境ID
echo   1. 访问 https://console.cloud.tencent.com/tcb
echo   2. 登录腾讯云账号
echo   3. 创建新环境（名称：yunyou-nanjiang）
echo   4. 记录环境ID（形如：xxxxxx-xxxxxx）
echo.
echo 第二步：获取腾讯云API密钥
echo   1. 访问 https://console.cloud.tencent.com/cam/capi
echo   2. 创建新密钥
echo   3. 保存SecretId和SecretKey（只显示一次！）
echo.
echo 第三步：配置GitHub Secrets
echo   1. 访问 https://github.com/Hua-bing-666/yunyou-nanjiang
echo   2. Settings -> Secrets and variables -> Actions
echo   3. 添加三个Secrets：
echo      - TCB_SECRET_ID: 您的SecretId
echo      - TCB_SECRET_KEY: 您的SecretKey
echo      - TCB_ENV_ID: 您的环境ID
echo.
echo 第四步：触发自动部署
echo   推送代码到main分支，GitHub Actions会自动部署
echo.
echo 第五步：验证部署
echo   1. 访问CloudBase控制台查看部署状态
echo   2. 获取访问地址并测试功能
echo   3. 启动后端服务器：cd backend && npm start
echo.

echo [4/5] 打开相关文档...
echo 正在打开部署指南...
start "" "CLOUDBASE_CONFIG_GUIDE.md"
timeout /t 2 >nul

echo [5/5] 准备开发环境...
echo.
echo 启动本地开发服务器：
echo   前端：cd my-travel && npm run dev
echo   后端：cd backend && npm start
echo.
echo 是否现在启动本地开发服务器？(Y/N)
set /p choice=

if /i "%choice%"=="Y" (
    echo 正在启动本地开发环境...
    
    echo 启动后端服务器...
    start cmd /k "cd /d "%~dp0backend" && npm start"
    timeout /t 3 >nul
    
    echo 启动前端开发服务器...
    start cmd /k "cd /d "%~dp0my-travel" && npm run dev"
    
    echo ✅ 本地开发环境已启动
    echo 前端：http://localhost:5173
    echo 后端：http://localhost:3000
) else (
    echo 跳过本地开发环境启动
)

echo.
echo ========================================
echo  部署准备完成！
echo ========================================
echo.
echo 下一步操作：
echo 1. 按照上面的步骤获取CloudBase配置
echo 2. 配置GitHub Secrets
echo 3. 推送代码触发自动部署
echo 4. 比赛演示时同时运行前端和后端
echo.
echo 详细说明请查看 CLOUDBASE_CONFIG_GUIDE.md
echo.
pause