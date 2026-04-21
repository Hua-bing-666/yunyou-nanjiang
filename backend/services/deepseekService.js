const axios = require('axios');
require('dotenv').config();

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    if (!this.apiKey) {
      console.warn('警告: DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置');
    }
  }

  /**
   * 生成系统提示词，指导AI作为南疆旅游助手
   */
  generateSystemPrompt() {
    return `你是南疆旅游助手，回答要简洁实用。重点：喀什古城、帕米尔高原、和田、阿克苏、克孜勒苏州等地旅游信息。

回答原则：
- 简洁明了，不超过3条重点
- 提供真实实用的信息
- 不确定的明确说明
- 友好专业，专注南疆旅游

快速回复要点，每条建议不超过1-2句话。`;
  }

  /**
   * 发送消息到DeepSeek API
   * @param {Array} messages - 消息历史数组
   * @returns {Promise<string>} - AI回复内容
   */
  async chat(messages) {
    try {
      if (!this.apiKey) {
        throw new Error('DeepSeek API Key 未配置');
      }

      const requestMessages = [
        { role: 'system', content: this.generateSystemPrompt() },
        ...messages
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: requestMessages,
          temperature: 0.5,
          max_tokens: 500,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 15000 // 15秒超时
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI回复为空');
      }

      return content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.response?.data || error.message);
      
      // 提供友好的错误提示
      if (error.response?.status === 401) {
        throw new Error('API密钥无效，请检查配置');
      } else if (error.response?.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接');
      } else {
        throw new Error(`AI服务暂时不可用: ${error.message}`);
      }
    }
  }

  /**
   * 测试API连接
   */
  async testConnection() {
    try {
      await this.chat([{ role: 'user', content: '你好' }]);
      return { success: true, message: 'DeepSeek API连接正常' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new DeepSeekService();