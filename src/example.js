const { recoverFromGarbledText, detectTextCredibility, quickRecover } = require('./index');

// 示例乱码文本（更真实的例子）
const examples = [
  // 中文乱码示例（UTF-8 被错误解释为 GBK/GB2312）
  'ä¸­æ–‡ä¹±ç ', // 中文乱码
  'æˆ'çˆ±ä¸­å›½', // 我爱中国  
  'ä½ å¥½ä¸–ç•Œ', // 你好世界
  
  // 英文乱码示例  
  'HÃ¤llo WÃ¶rld', // Hällo Wörld (Latin-1 -> UTF-8)
  'CafÃ©', // Café
  
  // 混合乱码
  'Hello ä¸­æ–‡', // Hello 中文
  'ä½ å¥½ï¼Œè¿™æ˜¯ä¸€ä¸ªæµ‹è¯•', // 你好，这是一个测试
  
  // 正常文本（用于对比）
  '这是一段正常的中文文本，包含常用汉字。',
  'This is normal English text with common words.',
  'Hello, 你好！Mixed content here.'
];

console.log('=== 乱码恢复示例（使用真实频率数据）===\n');

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
  
  console.log('---\n');
});

// 快速恢复示例
console.log('=== 快速恢复示例 ===\n');
const quickTests = ['ä¸­æ–‡ä¹±ç ', 'æˆ'çˆ±ä¸­å›½', 'ä½ å¥½ä¸–ç•Œ'];

quickTests.forEach((text, index) => {
  console.log(`快速测试 ${index + 1}: "${text}"`);
  const result = quickRecover(text);
  if (result) {
    console.log(`快速恢复结果: "${result.recoveredText}"`);
    console.log(`可信度: ${result.credibility.toFixed(2)}`);
    console.log(`编码转换: ${result.sourceEncoding} -> ${result.targetEncoding}`);
  } else {
    console.log('快速恢复失败');
  }
  console.log('---');
});

// 文本可信度检测示例
console.log('\n=== 文本可信度检测示例（基于真实字符频率）===\n');
const testTexts = [
  '这是一段正常的中文文本，包含了很多常用汉字，应该有很高的可信度。',
  'This is a normal English sentence with common words that should score well.',
  'ä¸­æ–‡ä¹±ç âœâ€¢â', // 乱码文本
  '123456789!@#$%^&*()', // 纯符号
  '正常中英文mixed text混合内容。', // 混合语言
  '�������乱码字符����', // 明显乱码
  '', // 空文本
  '的的的的的的的的的的', // 重复字符
  '你好，世界！这是一个测试。', // 正常中文带标点
  'Hello, world! This is a test.' // 正常英文带标点
];

testTexts.forEach((text, index) => {
  const credibility = detectTextCredibility(text);
  console.log(`文本 ${index + 1}: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`);
  console.log(`可信度得分: ${credibility.score.toFixed(2)}`);
  console.log(`主要语言: ${credibility.details.language}`);
  console.log(`详细得分:`);
  console.log(`  - 频率分析: ${credibility.details.frequencyScore.toFixed(2)}`);
  console.log(`  - 语言一致性: ${credibility.details.languageScore.toFixed(2)}`);
  console.log(`  - 文本结构: ${credibility.details.structureScore.toFixed(2)}`);
  console.log(`统计信息:`);
  console.log(`  - 文本长度: ${credibility.details.stats.length}`);
  console.log(`  - 中文比例: ${(credibility.details.stats.chineseRatio * 100).toFixed(1)}%`);
  console.log(`  - 英文比例: ${(credibility.details.stats.englishRatio * 100).toFixed(1)}%`);
  console.log('---');
});

// 性能测试
console.log('\n=== 性能测试 ===\n');
const performanceTests = [
  'ä¸­æ–‡ä¹±ç '.repeat(100), // 长文本
  'æˆ'çˆ±ä¸­å›½', // 短文本
  'Hello ä¸­æ–‡ World æµ‹è¯•', // 混合文本
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
