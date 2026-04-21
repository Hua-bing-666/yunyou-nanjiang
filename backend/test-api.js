const path = require('path');
const fs = require('fs');

// 手动加载.env文件
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex !== -1) {
        const key = trimmed.substring(0, equalsIndex).trim();
        const value = trimmed.substring(equalsIndex + 1).trim();
        process.env[key] = value;
      }
    }
  });
  console.log('已从', envPath, '加载环境变量');
} else {
  console.log('未找到.env文件:', envPath);
}

const axios = require('axios');

async function testDeepSeekAPI() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  
  console.log('测试DeepSeek API连接...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : '未设置');
  console.log('API URL:', apiUrl);
  console.log('API Key 长度:', apiKey ? apiKey.length : 0);
  
  if (!apiKey) {
    console.error('错误: API密钥未设置');
    return;
  }
  
  // 检查API密钥格式
  if (!apiKey.startsWith('sk-')) {
    console.warn('警告: API密钥格式可能不正确，通常以"sk-"开头');
  }
  
  try {
    const response = await axios.post(
      apiUrl,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, are you working?' }
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );
    
    console.log('API响应状态:', response.status);
    console.log('API响应内容:', response.data.choices[0]?.message?.content || '无内容');
    console.log('API连接测试成功!');
    
  } catch (error) {
    console.error('API连接失败:');
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('错误: API密钥无效或已过期');
        console.error('建议: 请检查DeepSeek账户余额和API密钥有效期');
      } else if (error.response.status === 429) {
        console.error('错误: 请求过于频繁，达到速率限制');
      }
    }
    
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  }
}

// 检查环境变量是否加载正确
console.log('环境变量检查:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DEEPSEEK_API_KEY exists:', !!process.env.DEEPSEEK_API_KEY);
console.log('当前目录:', __dirname);
console.log('环境文件路径:', envPath);

testDeepSeekAPI();
