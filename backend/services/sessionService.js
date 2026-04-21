/**
 * 会话管理服务
 * 管理用户对话会话，支持上下文记忆和过期清理
 */

class SessionService {
  constructor() {
    // 存储所有会话 { sessionId: { messages, lastActivity, createdAt } }
    this.sessions = new Map();
    this.maxContextMessages = parseInt(process.env.MAX_CONTEXT_MESSAGES) || 10;
    this.sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 30;
    
    // 定时清理过期会话（每小时一次）
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * 创建新会话
   * @returns {string} sessionId
   */
  createSession() {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    this.sessions.set(sessionId, {
      messages: [],
      lastActivity: now,
      createdAt: now,
      sessionId
    });
    
    console.log(`创建新会话: ${sessionId}`);
    return sessionId;
  }

  /**
   * 获取会话消息历史
   * @param {string} sessionId 
   * @returns {Array} 消息数组
   */
  getMessages(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    
    // 更新最后活动时间
    session.lastActivity = Date.now();
    return session.messages;
  }

  /**
   * 添加消息到会话
   * @param {string} sessionId 
   * @param {Object} message - { role, content }
   * @returns {Array} 更新后的消息数组
   */
  addMessage(sessionId, message) {
    let session = this.sessions.get(sessionId);
    
    // 如果会话不存在，创建新会话
    if (!session) {
      console.log(`会话 ${sessionId} 不存在，创建新会话`);
      sessionId = this.createSession();
      session = this.sessions.get(sessionId);
    }
    
    // 添加到消息历史
    session.messages.push({
      ...message,
      timestamp: Date.now()
    });
    
    // 限制上下文长度，保留最近的消息
    if (session.messages.length > this.maxContextMessages) {
      // 移除最旧的消息，但保留至少1条
      const excess = session.messages.length - this.maxContextMessages;
      session.messages.splice(0, excess);
    }
    
    // 更新最后活动时间
    session.lastActivity = Date.now();
    
    return session.messages;
  }

  /**
   * 清理指定会话的历史（保留欢迎消息）
   * @param {string} sessionId 
   */
  clearSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
      session.lastActivity = Date.now();
      console.log(`已清理会话 ${sessionId} 的历史`);
    }
  }

  /**
   * 清理所有过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const timeoutMs = this.sessionTimeoutMinutes * 60 * 1000;
    let expiredCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeoutMs) {
        this.sessions.delete(sessionId);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`清理了 ${expiredCount} 个过期会话`);
    }
  }

  /**
   * 获取会话统计信息
   */
  getStats() {
    const now = Date.now();
    const timeoutMs = this.sessionTimeoutMinutes * 60 * 1000;
    
    let activeSessions = 0;
    let expiredSessions = 0;
    let totalMessages = 0;
    
    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
      if (now - session.lastActivity > timeoutMs) {
        expiredSessions++;
      } else {
        activeSessions++;
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      expiredSessions,
      totalMessages,
      maxContextMessages: this.maxContextMessages,
      sessionTimeoutMinutes: this.sessionTimeoutMinutes
    };
  }

  /**
   * 生成唯一会话ID
   * @returns {string}
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 验证会话是否存在且未过期
   * @param {string} sessionId 
   * @returns {boolean}
   */
  isValidSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    const now = Date.now();
    const timeoutMs = this.sessionTimeoutMinutes * 60 * 1000;
    
    return now - session.lastActivity <= timeoutMs;
  }

  /**
   * 延长会话有效期
   * @param {string} sessionId 
   */
  renewSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }
}

// 导出单例实例
module.exports = new SessionService();