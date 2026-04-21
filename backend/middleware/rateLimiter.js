const rateLimit = require('express-rate-limit');

/**
 * 创建速率限制器中间件
 */
const createRateLimiter = () => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 默认1分钟
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60; // 默认每分钟60次
  
  return rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: `请求过于频繁，请 ${Math.ceil(windowMs / 1000 / 60)} 分钟后再试`,
      code: 429
    },
    standardHeaders: true, // 返回标准的RateLimit-* headers
    legacyHeaders: false, // 禁用X-RateLimit-* headers
    
    // 自定义key生成器，基于IP
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress;
    },
    
    // 跳过某些请求（如健康检查）
    skip: (req) => {
      // 跳过健康检查端点
      if (req.path === '/api/health') {
        return true;
      }
      return false;
    },
    
    // 当达到限制时的处理
    handler: (req, res, next, options) => {
      res.status(options.statusCode || 429).json(options.message);
    }
  });
};

/**
 * 宽松的速率限制器（用于非关键端点）
 */
const createLooseRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 300, // 每分钟300次
    message: {
      success: false,
      error: '请求过于频繁，请稍后再试',
      code: 429
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * 严格的速率限制器（用于关键或易滥用端点）
 */
const createStrictRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 30, // 每15分钟30次
    message: {
      success: false,
      error: '请求过于频繁，请15分钟后再试',
      code: 429
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  createRateLimiter,
  createLooseRateLimiter,
  createStrictRateLimiter
};