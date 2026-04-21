const axios = require('axios');

async function testPerformance() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  
  console.log('测试AI响应性能...');
  
  if (!apiKey) {
    console.error('错误: API密钥未设置');
    return;
  }
  
  // 测试不同配置的响应时间
  const testCases = [
    {
      name: '快速模式 (max_tokens: 300)',
      config: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位南疆旅游助手，回答请简洁明了，不超过100字。' },
          { role: 'user', content: '喀什古城有什么好玩的？' }
        ],
        temperature: 0.3,
        max_tokens: 300,
        stream: false
      }
    },
    {
      name: '标准模式 (max_tokens: 500)',
      config: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位南疆旅游助手，提供实用的旅游信息。' },
          { role: 'user', content: '喀什古城有什么好玩的？' }
        ],
        temperature: 0.5,
        max_tokens: 500,
        stream: false
      }
    },
    {
      name: '极简模式 (max_tokens: 150)',
      config: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '请用最简短的语言回答。' },
          { role: 'user', content: '喀什古城有什么好玩的？' }
        ],
        temperature: 0.2,
        max_tokens: 150,
        stream: false
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n测试: ${testCase.name}`);
    console.log('配置:', JSON.stringify({
      max_tokens: testCase.config.max_tokens,
      temperature: testCase.config.temperature
    }, null, 2));
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        apiUrl,
        testCase.config,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000 // 10秒超时
        }
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const content = response.data.choices[0]?.message?.content || '';
      const wordCount = content.split(/\s+/).length;
      
      console.log(`响应时间: ${duration}ms`);
      console.log(`回复长度: ${wordCount}个词`);
      console.log(`回复内容: ${content.substring(0, 100)}...`);
      
      if (duration < 2000) {
        console.log('✅ 性能优秀');
      } else if (duration < 5000) {
        console.log('⚠️  性能可接受');
      } else {
        console.log('❌ 性能较差');
      }
      
    } catch (error) {
      console.error(`测试失败: ${error.message}`);
    }
    
    // 等待1秒再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 手动加载.env文件
const path = require('path');
const fs = require('fs');
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
  console.log('已加载环境变量');
}

testPerformance();