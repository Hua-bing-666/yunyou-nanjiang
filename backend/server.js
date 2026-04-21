const express = require('express');
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');
const { createRateLimiter } = require('./middleware/rateLimiter');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// CORS配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// 应用速率限制器到所有API路由
const rateLimiter = createRateLimiter();
app.use('/api', rateLimiter);

// API路由
app.use('/api', chatRoutes);

// 根路径欢迎页面
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '南疆旅游AI助手后端服务',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health',
      status: 'GET /api/status',
      stats: 'GET /api/stats',
      newSession: 'POST /api/session/new',
      clearSession: 'DELETE /api/session/:sessionId'
    },
    documentation: '这是一个为南疆旅游网站提供AI对话功能的后端服务'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '未找到请求的资源',
    path: req.path
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err.stack);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  const host = server.address().address;
  const port = server.address().port;
  
  console.log('='.repeat(50));
  console.log('🚀 南疆旅游AI助手后端服务已启动');
  console.log(`📡 地址: http://${host === '::' ? 'localhost' : host}:${port}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 CORS来源: ${corsOptions.origin}`);
  console.log('='.repeat(50));
  console.log('可用端点:');
  console.log(`  GET  /          - 欢迎页面`);
  console.log(`  POST /api/chat  - AI对话`);
  console.log(`  GET  /api/health - 健康检查`);
  console.log(`  GET  /api/status - 服务状态`);
  console.log(`  GET  /api/stats  - 会话统计`);
  console.log('='.repeat(50));
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 未捕获的Promise拒绝处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

module.exports = server;