const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
const sessionService = require('../services/sessionService');

/**
 * 聊天对话接口
 * POST /api/chat
 * 请求体：
 * {
 *   "message": "用户消息内容",
 *   "sessionId": "可选，会话ID"  
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId: providedSessionId } = req.body;
    
    // 验证请求
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 处理会话
    let sessionId = providedSessionId;
    let isNewSession = false;
    
    if (!sessionId || !sessionService.isValidSession(sessionId)) {
      // 如果会话不存在或已过期，创建新会话
      sessionId = sessionService.createSession();
      isNewSession = true;
    } else {
      // 更新会话活动时间
      sessionService.renewSession(sessionId);
    }

    // 获取当前会话的消息历史
    const messages = sessionService.getMessages(sessionId);
    
    // 添加用户消息到历史
    const userMessage = {
      role: 'user',
      content: message.trim()
    };
    
    sessionService.addMessage(sessionId, userMessage);
    
    // 调用DeepSeek API获取回复
    const aiReply = await deepseekService.chat(messages);
    
    // 添加AI回复到历史
    const assistantMessage = {
      role: 'assistant',
      content: aiReply
    };
    
    sessionService.addMessage(sessionId, assistantMessage);
    
    // 返回成功响应
    return res.json({
      success: true,
      data: {
        reply: aiReply,
        sessionId,
        isNewSession,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('聊天处理错误:', error);
    
    // 根据错误类型返回不同的状态码
    let statusCode = 500;
    let errorMessage = error.message || '服务器内部错误';
    
    if (error.message.includes('API密钥无效')) {
      statusCode = 401;
    } else if (error.message.includes('请求过于频繁')) {
      statusCode = 429;
    } else if (error.message.includes('请求超时')) {
      statusCode = 504;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: statusCode
    });
  }
});

/**
 * 创建新会话
 * POST /api/session/new
 */
router.post('/session/new', (req, res) => {
  try {
    const sessionId = sessionService.createSession();
    
    return res.json({
      success: true,
      data: {
        sessionId,
        message: '会话创建成功',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('创建会话错误:', error);
    return res.status(500).json({
      success: false,
      error: '创建会话失败'
    });
  }
});

/**
 * 清理会话历史
 * DELETE /api/session/:sessionId
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    sessionService.clearSession(sessionId);
    
    return res.json({
      success: true,
      data: {
        sessionId,
        message: '会话历史已清理',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('清理会话错误:', error);
    return res.status(500).json({
      success: false,
      error: '清理会话失败'
    });
  }
});

/**
 * 获取会话统计信息
 * GET /api/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = sessionService.getStats();
    
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    return res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
});

/**
 * 健康检查端点
 * GET /api/health
 */
router.get('/health', (req, res) => {
  return res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      service: 'travel-ai-backend',
      version: '1.0.0'
    }
  });
});

/**
 * API状态检查
 * GET /api/status
 */
router.get('/status', async (req, res) => {
  try {
    const sessionStats = sessionService.getStats();
    const apiStatus = await deepseekService.testConnection();
    
    return res.json({
      success: true,
      data: {
        server: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        session: sessionStats,
        api: apiStatus
      }
    });
  } catch (error) {
    console.error('状态检查错误:', error);
    return res.status(500).json({
      success: false,
      error: '状态检查失败'
    });
  }
});

module.exports = router;