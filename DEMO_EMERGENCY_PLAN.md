# 演示日应急方案

## 概述

本文档为"中国大学生计算机设计大赛"演示日提供完整的应急方案，确保在云服务出现问题时能够快速切换到本地演示环境。

## 应急场景分类

### 场景A：网络连接问题
- 比赛现场Wi-Fi不稳定
- 手机网络信号弱
- 防火墙限制访问

### 场景B：云服务故障
- Vercel前端服务不可用
- Render后端服务休眠或故障
- 域名解析问题

### 场景C：设备兼容性问题
- 评委手机浏览器兼容性问题
- 笔记本电脑环境问题
- 投影设备连接问题

## 应急方案总览

### 方案1：本地演示（首选备用方案）
- 在笔记本电脑上运行完整的本地服务
- 使用手机热点或现场Wi-Fi访问
- 完全独立，不受云服务影响

### 方案2：混合演示
- 本地运行后端服务
- 使用Vercel前端（如果可用）
- 或本地运行前端

### 方案3：简化演示
- 使用预录制的演示视频
- 展示关键功能的截图
- 口头介绍技术方案

## 详细实施步骤

### 方案1：本地完整演示（推荐）

#### 准备工作（演示前完成）
1. **环境检查**：
   ```bash
   # 检查Node.js版本
   node --version  # 需要 >= 18.0.0
   
   # 检查npm版本
   npm --version   # 需要 >= 8.0.0
   ```

2. **依赖安装**：
   ```bash
   # 安装前端依赖
   cd my-travel
   npm install
   
   # 安装后端依赖
   cd ../backend
   npm install
   ```

3. **配置修改**：
   编辑 `my-travel/.env` 文件：
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. **测试运行**：
   ```bash
   # 终端1：启动后端
   cd backend
   npm start
   
   # 终端2：启动前端
   cd my-travel
   npm run dev
   ```

#### 演示日操作步骤

1. **启动服务**（演示前5分钟）：
   ```bash
   # 使用一键启动脚本（见下文）
   .\start-local-demo.bat
   ```

2. **获取访问地址**：
   - 前端地址：`http://localhost:5173`
   - 后端地址：`http://localhost:3000`

3. **手机访问设置**：
   - 确保手机和电脑连接同一Wi-Fi
   - 在手机上访问：`http://电脑IP地址:5173`
   - 获取电脑IP地址：在命令行运行 `ipconfig`（Windows）

### 方案2：混合演示

#### 配置方式
1. **本地后端 + 云前端**：
   ```bash
   # 启动本地后端
   cd backend
   npm start
   
   # 修改前端环境变量为本地后端
   # 在my-travel/.env中设置：
   # VITE_API_URL=http://localhost:3000
   
   # 重新构建前端并部署到Vercel
   cd my-travel
   npm run build
   # 然后推送到GitHub触发Vercel重新部署
   ```

2. **云后端 + 本地前端**：
   ```bash
   # 修改前端环境变量为云后端
   # 在my-travel/.env中设置：
   # VITE_API_URL=https://your-backend.onrender.com
   
   # 启动本地前端
   cd my-travel
   npm run dev
   ```

### 方案3：简化演示

#### 准备工作
1. **录制演示视频**（提前准备）：
   - 录制3分钟的核心功能演示
   - 保存为MP4格式
   - 准备备用播放设备

2. **准备截图**：
   - 关键功能界面截图
   - 技术架构图
   - 性能测试结果截图

3. **准备讲稿**：
   - 项目介绍（1分钟）
   - 技术亮点（2分钟）
   - 创新点（1分钟）

## 一键启动脚本

### Windows批处理脚本（start-local-demo.bat）
```batch
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
```

### 创建脚本文件
将上面的内容保存为 `start-local-demo.bat`，放在项目根目录。

## 网络配置指南

### 获取电脑IP地址
```bash
# Windows
ipconfig
# 查找 "IPv4 地址"（通常是 192.168.x.x 或 10.x.x.x）

# macOS/Linux
ifconfig
# 查找 "inet" 地址
```

### 防火墙设置
1. **打开防火墙端口**：
   ```bash
   # Windows PowerShell（管理员身份运行）
   New-NetFirewallRule -DisplayName "Web Dev Ports" -Direction Inbound -Protocol TCP -LocalPort 3000,5173 -Action Allow
   ```

2. **临时关闭防火墙**（仅演示期间）：
   ```bash
   # Windows
   netsh advfirewall set allprofiles state off
   
   # 演示后重新启用
   netsh advfirewall set allprofiles state on
   ```

## 演示流程应急调整

### 标准演示流程（5分钟）
1. 项目介绍（30秒）
2. 核心功能演示（3分钟）
3. 技术亮点介绍（1分钟）
4. Q&A（30秒）

### 应急简化流程（3分钟）
1. 项目介绍（30秒）
2. 关键功能展示（1.5分钟）
   - 登录体验
   - 地图浏览
   - AI助手演示
3. 技术方案介绍（1分钟）

### 最小化演示流程（1分钟）
1. 项目概述（20秒）
2. 功能视频展示（30秒）
3. 技术亮点（10秒）

## 故障排查清单

### 问题：服务启动失败
**检查步骤**：
1. 检查Node.js和npm版本
2. 检查依赖是否安装：`npm list`
3. 检查端口是否被占用：`netstat -ano | findstr :5173`
4. 查看错误日志

### 问题：手机无法访问
**检查步骤**：
1. 确认电脑和手机在同一网络
2. 检查电脑防火墙设置
3. 使用IP地址而不是localhost
4. 尝试不同的浏览器

### 问题：AI助手无响应
**检查步骤**：
1. 检查后端服务是否运行：访问 `http://localhost:3000`
2. 检查前端控制台错误
3. 尝试使用模拟回复模式

### 问题：地图无法加载
**检查步骤**：
1. 检查网络连接
2. 检查浏览器控制台错误
3. 尝试刷新页面

## 演示日检查清单

### 演示前1小时
- [ ] 测试云服务访问
- [ ] 准备本地演示环境
- [ ] 检查网络连接
- [ ] 准备应急脚本

### 演示前30分钟
- [ ] 启动本地服务测试
- [ ] 手机连接测试
- [ ] 投影设备测试
- [ ] 讲稿复习

### 演示前10分钟
- [ ] 云服务最终检查
- [ ] 本地服务就绪
- [ ] 应急方案确认
- [ ] 心态调整

### 演示中
- [ ] 保持冷静，按计划演示
- [ ] 遇到问题立即切换方案
- [ ] 重点展示核心功能
- [ ] 控制演示时间

## 技术联系人信息

### 现场技术支持
- **姓名**：[填写演示同学姓名]
- **电话**：[填写联系电话]
- **职责**：技术操作和故障排除

### 远程支持（如有需要）
- **GitHub仓库**：[填写仓库地址]
- **文档位置**：本项目所有文档
- **关键文件**：
  - `DEPLOYMENT_GUIDE.md` - 部署指南
  - `PERFORMANCE_OPTIMIZATION.md` - 性能优化
  - `DEMO_EMERGENCY_PLAN.md` - 应急方案

## 成功标准

### 基础成功
- [ ] 完成项目演示
- [ ] 核心功能正常展示
- [ ] 技术方案清晰传达

### 进阶成功
- [ ] 现场互动良好
- [ ] 回答问题准确
- [ ] 演示流畅无中断

### 卓越成功
- [ ] 评委高度评价
- [ ] 技术亮点突出
- [ ] 创新点明确

---

**重要提示**：无论采用哪种方案，最重要的是保持自信、清晰地传达项目的价值和创新点。技术实现只是支撑，项目的核心价值在于解决实际问题、提供良好用户体验。

**祝您演示成功，取得优异成绩！** 🚀