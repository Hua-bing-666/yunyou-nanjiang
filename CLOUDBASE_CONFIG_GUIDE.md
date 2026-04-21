# CloudBase配置获取指南

## 第一步：获取CloudBase环境ID

### 1.1 登录CloudBase控制台
1. 访问 [CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 使用您的腾讯云账号登录

### 1.2 创建或选择环境
1. 如果您是第一次使用，点击"新建环境"
2. 填写环境信息：
   - **环境名称**：`yunyou-nanjiang`（建议）
   - **环境标签**：选择"生产环境"
   - **套餐版本**：选择"基础版 1"（免费）
   - **地域**：选择"上海"或"广州"（国内节点）
3. 点击"立即开通"

### 1.3 获取环境ID
1. 在环境列表中，找到您的环境
2. **环境ID**显示在环境名称下方，形如：`xxxxxx-xxxxxx`
3. 记录下这个环境ID

**示例：**
```
环境名称：yunyou-nanjiang
环境ID：abcd1234-efgh5678
```

## 第二步：获取腾讯云API密钥

### 2.1 访问API密钥管理
1. 访问 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 确保您已登录腾讯云账号

### 2.2 创建API密钥
1. 点击"新建密钥"
2. 选择"自定义创建"
3. 填写密钥信息：
   - **密钥名称**：`yunyou-nanjiang-deploy`
   - **描述**：南疆旅游AI助手部署密钥
   - **权限**：选择"CloudBase全读写权限"
4. 点击"完成"

### 2.3 保存密钥信息
**重要：密钥只显示一次，请立即保存！**

1. **SecretId**：以 `AKID` 开头的字符串
2. **SecretKey**：长字符串，包含字母和数字

**示例格式（请勿使用此示例，使用您自己的密钥）：**
```
SecretId: YOUR_SECRET_ID_HERE
SecretKey: YOUR_SECRET_KEY_HERE
```

## 第三步：配置GitHub Secrets

### 3.1 进入GitHub仓库设置
1. 访问您的GitHub仓库：`https://github.com/Hua-bing-666/yunyou-nanjiang`
2. 点击"Settings"（设置）
3. 左侧菜单选择"Secrets and variables" → "Actions"

### 3.2 添加三个Secrets
点击"New repository secret"，依次添加：

#### 1. TCB_SECRET_ID
- **Name**: `TCB_SECRET_ID`
- **Value**: 您的SecretId（从第二步获取）

#### 2. TCB_SECRET_KEY
- **Name**: `TCB_SECRET_KEY`
- **Value**: 您的SecretKey（从第二步获取）

#### 3. TCB_ENV_ID
- **Name**: `TCB_ENV_ID`
- **Value**: 您的环境ID（从第一步获取）

**添加完成后应该有三个Secrets：**
```
TCB_SECRET_ID
TCB_SECRET_KEY  
TCB_ENV_ID
```

## 第四步：环境变量配置

### 4.1 前端环境变量调整
由于前端部署到CloudBase，后端本地运行，需要根据环境调整API地址。

**开发环境**（本地运行）：
```
VITE_API_URL=http://localhost:3000
```

**生产环境**（CloudBase部署）：
后端地址需要根据实际部署情况设置。

### 4.2 创建环境配置文件

#### 创建 `.env.development`（开发环境）：
```env
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=development
```

#### 创建 `.env.production`（生产环境）：
```env
# 比赛演示时，后端运行在本地，使用公网IP或本地网络IP
# 示例1：如果后端有公网IP
# VITE_API_URL=http://your-public-ip:3000

# 示例2：本地网络（同一WiFi）
# VITE_API_URL=http://192.168.1.100:3000

# 示例3：默认（比赛时调整）
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=production
```

## 第五步：验证配置

### 5.1 检查GitHub Actions配置
1. 推送代码到main分支
2. 在GitHub仓库的"Actions"标签页查看工作流运行状态
3. 如果配置正确，工作流会自动部署到CloudBase

### 5.2 验证部署成功
1. 部署完成后，访问CloudBase控制台
2. 进入您的环境 → 静态网站托管
3. 获取访问地址，形如：`https://xxxx.tcloudbaseapp.com`
4. 访问该地址，确认前端正常显示

## 故障排除

### 问题1：部署失败，提示缺少配置
**错误信息**：`缺少CloudBase配置，请在GitHub Secrets中设置`

**解决**：
1. 检查是否已添加三个GitHub Secrets
2. 检查SecretId/SecretKey是否正确
3. 检查环境ID是否正确

### 问题2：前端无法连接到后端
**现象**：前端能访问，但API请求失败

**解决**：
1. 确保后端服务器正在运行：`cd backend && npm start`
2. 检查后端CORS配置是否允许前端域名访问
3. 检查网络连接和防火墙设置

### 问题3：CloudBase环境创建失败
**现象**：无法创建新环境

**解决**：
1. 确认腾讯云账号已完成实名认证
2. 检查是否有未支付的账单
3. 尝试不同的地域（上海/广州）

## 比赛演示配置

### 比赛日设置：
1. **前端**：CloudBase静态托管（公网访问）
2. **后端**：本地Node.js服务器
3. **网络**：确保前后端在同一网络

### 网络配置建议：
1. 将前端 `.env.production` 中的 `VITE_API_URL` 设置为后端电脑的IP地址
2. 确保后端服务器的3000端口对外开放
3. 测试从手机访问前端，能正常调用后端API

### 示例配置：
```
# .env.production（比赛时使用）
VITE_API_URL=http://192.168.1.100:3000
```

## 安全注意事项

### 密钥安全：
1. **不要**将SecretId和SecretKey提交到代码仓库
2. **不要**在公共场合展示密钥信息
3. 定期轮换密钥（比赛后可删除）

### 环境安全：
1. 生产环境使用独立的密钥
2. 限制API密钥的权限范围
3. 监控API调用情况

## 后续步骤

### 部署完成后：
1. 访问CloudBase获取的前端地址
2. 启动后端服务器：`cd backend && npm start`
3. 测试所有功能正常工作
4. 准备演示脚本和材料

### 比赛准备：
1. 生成前端访问二维码
2. 准备应急方案（全栈本地运行）
3. 测试移动端访问
4. 演练演示流程

## 技术支持

### 遇到问题：
1. 查看CloudBase部署日志
2. 查看GitHub Actions运行日志
3. 检查控制台错误信息
4. 参考本文档故障排除部分

### 需要帮助：
1. 记录具体的错误信息
2. 截图错误页面
3. 描述操作步骤和环境

---

**完成以上步骤后，您的南疆旅游AI助手前端将成功部署到腾讯云CloudBase静态托管，后端在本地运行，为比赛演示做好准备！**