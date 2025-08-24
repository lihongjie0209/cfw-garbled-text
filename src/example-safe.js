const { recoverFromGarbledText, detectTextCredibility, quickRecover } = require('./index');

// 示例乱码文本（使用转义序列以避免编码问题）
const examples = [
  // 中文乱码示例
  'ä¸­æ–‡ä¹±ç ',
  'Hello Worldï¼Œè¿™æ˜¯ä¸€ä¸ªæµ‹è¯•',
  
  // 英文乱码示例  
  'HÃ¤llo WÃ¶rld', // Hällo Wörld (Latin-1 -> UTF-8)
  'CafÃ©', // Café
  
  // 混合乱码
  'Hello ä¸­æ–‡',
  
  // 正常文本（用于对比）
  '这是一段正常的中文文本，包含常用汉字。',
  'This is normal English text with common words.',
  'Hello, 你好！Mixed content here.'
];

console.log('=== 乱码恢复示例（使用真实频率数据）===\\n');

examples.forEach((garbledText, index) => {
  console.log(`示例 ${index + 1}: "${garbledText}"`);
  
  // 检测原始文本的可信度
  const originalCredibility = detectTextCredibility(garbledText);
  console.log(`原始可信度: ${originalCredibility.score.toFixed(2)} (语言: ${originalCredibility.details.language})`);
  
  // 尝试恢复
  try {
    const results = recoverFromGarbledText(garbledText, { maxResults: 3, minCredibility: 20 });
    
    if (results.length > 0) {
      console.log('恢复结果:');
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. "${result.recoveredText}"`);
        console.log(`     编码: ${result.sourceEncoding} -> ${result.targetEncoding}`);
        console.log(`     可信度: ${result.credibility.toFixed(2)}`);
        console.log(`     语言: ${result.details.language}`);
        
        // 如果可信度有显著提升，标记为可能的正确恢复
        if (result.credibility > originalCredibility.score + 10) {
          console.log(`     ✓ 可信度提升显著 (+${(result.credibility - originalCredibility.score).toFixed(2)})`);
        }
      });
    } else {
      console.log('未找到合适的恢复结果（可能本身就是正常文本）');
    }
  } catch (error) {
    console.log('恢复失败:', error.message);
  }
  
  console.log('---\\n');
});

// 快速恢复示例
console.log('=== 快速恢复示例 ===\\n');
const quickTest = 'ä¸­æ–‡ä¹±ç ';

console.log(`快速测试: "${quickTest}"`);
const result = quickRecover(quickTest);
if (result) {
  console.log(`快速恢复结果: "${result.recoveredText}"`);
  console.log(`可信度: ${result.credibility.toFixed(2)}`);
  console.log(`编码转换: ${result.sourceEncoding} -> ${result.targetEncoding}`);
} else {
  console.log('快速恢复失败');
}
console.log('---');

// 文本可信度检测示例
console.log('\\n=== 文本可信度检测示例（基于真实字符频率）===\\n');
const testTexts = [
  '这是一段正常的中文文本，包含了很多常用汉字，应该有很高的可信度。',
  'This is a normal English sentence with common words that should score well.',
  'ä¸­æ–‡ä¹±ç âœâ€¢â', // 乱码文本
  '123456789!@#$%^&*()', // 纯符号
  '正常中英文mixed text混合内容。', // 混合语言
  '', // 空文本
  '的的的的的的的的的的', // 重复字符
  '你好，世界！这是一个测试。', // 正常中文带标点
  'Hello, world! This is a test.' // 正常英文带标点
];

testTexts.forEach((text, index) => {
  const credibility = detectTextCredibility(text);
  const displayText = text.length > 30 ? text.slice(0, 30) + '...' : text;
  console.log(`文本 ${index + 1}: "${displayText}"`);
  console.log(`可信度得分: ${credibility.score.toFixed(2)}`);
  console.log(`主要语言: ${credibility.details.language || 'undefined'}`);
  console.log(`详细得分:`);
  console.log(`  - 频率分析: ${(credibility.details.frequencyScore || 0).toFixed(2)}`);
  console.log(`  - 语言一致性: ${(credibility.details.languageScore || 0).toFixed(2)}`);
  console.log(`  - 文本结构: ${(credibility.details.structureScore || 0).toFixed(2)}`);
  console.log(`统计信息:`);
  console.log(`  - 文本长度: ${credibility.details.stats ? credibility.details.stats.length : 0}`);
  console.log(`  - 中文比例: ${credibility.details.stats ? (credibility.details.stats.chineseRatio * 100).toFixed(1) : 0}%`);
  console.log(`  - 英文比例: ${credibility.details.stats ? (credibility.details.stats.englishRatio * 100).toFixed(1) : 0}%`);
  console.log('---');
});

// 性能测试
console.log('\\n=== 性能测试 ===\\n');
const performanceTests = [
  'ä¸­æ–‡ä¹±ç '.repeat(100), // 长文本
  'Hello World', // 短文本
  'Hello ä¸­æ–‡ World', // 混合文本
];

performanceTests.forEach((text, index) => {
  console.log(`性能测试 ${index + 1}: ${text.length} 字符`);
  const startTime = Date.now();
  
  try {
    const results = recoverFromGarbledText(text, { maxResults: 5 });
    const endTime = Date.now();
    
    console.log(`处理时间: ${endTime - startTime}ms`);
    console.log(`找到 ${results.length} 个可能的恢复结果`);
    if (results.length > 0) {
      console.log(`最佳结果可信度: ${results[0].credibility.toFixed(2)}`);
    }
  } catch (error) {
    console.log(`处理失败: ${error.message}`);
  }
  console.log('---');
});

console.log('\\n=== 演示完成 ===');
console.log('\\n说明:');
console.log('1. 本示例使用了从现代汉语汉字频率表.csv转换的真实字符频率数据');
console.log('2. 频率字典包含5567个中文字符的实际使用频率');
console.log('3. 可信度评估基于字符频率、语言一致性和文本结构三个维度');
console.log('4. 编码恢复算法会尝试多种常见的编码转换组合');
console.log('5. 结果按可信度降序排列，帮助用户选择最可能正确的恢复结果');
