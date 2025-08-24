const garbledRecovery = require('../src/index');

/**
 * 测试新的编码配置系统
 */
function testNewConfigSystem() {
  console.log('=== 乱码恢复新配置系统测试 ===\n');

  // 1. 测试支持的编码列表
  console.log('1. 支持的编码:');
  console.log('所有编码:', garbledRecovery.getSupportedEncodings());
  console.log('中文编码:', garbledRecovery.getSupportedEncodings('chinese'));
  console.log('西文编码:', garbledRecovery.getSupportedEncodings('western'));
  console.log();

  // 2. 测试可用策略
  console.log('2. 可用策略:');
  console.log(garbledRecovery.getAvailableStrategies());
  console.log();

  // 3. 测试编码检测
  const testTexts = [
    'IO Error: Cannot open file "test.db": Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ',
    'ä¸­æ–‡ä¹±ç ',
    'HÃ¤llo WÃ¶rld',
    'garbled chinese text'
  ];

  console.log('3. 编码检测测试:');
  testTexts.forEach((text, index) => {
    const possibleEncodings = garbledRecovery.detectPossibleEncodings(text);
    console.log(`文本${index + 1}: "${text}"`);
    console.log(`可能编码: [${possibleEncodings.join(', ')}]`);
    console.log();
  });

  // 4. 测试推荐编码对
  console.log('4. 推荐编码对测试:');
  const sampleText = 'IO Error: Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ';
  const recommendedPairs = garbledRecovery.getRecommendedEncodingPairs(sampleText, { strategy: 'fast' });
  console.log(`文本: "${sampleText}"`);
  console.log('推荐编码对:');
  recommendedPairs.slice(0, 5).forEach(pair => {
    console.log(`  ${pair.sourceEncoding} -> ${pair.targetEncoding} (${pair.description})`);
  });
  console.log();

  // 5. 测试不同策略的恢复
  console.log('5. 不同策略恢复测试:');
  const garbledText = 'IO Error: Cannot open file: Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ';
  
  const strategies = ['fast', 'balanced', 'aggressive'];
  strategies.forEach(strategy => {
    console.log(`\\n--- 策略: ${strategy} ---`);
    try {
      const result = garbledRecovery.quickRecover(garbledText, { strategy });
      if (result) {
        console.log(`恢复结果: ${result.recoveredText}`);
        console.log(`编码转换: ${result.sourceEncoding} -> ${result.targetEncoding}`);
        console.log(`可信度: ${result.credibility}`);
        console.log(`描述: ${result.description}`);
      } else {
        console.log('未找到合适的恢复结果');
      }
    } catch (error) {
      console.log(`错误: ${error.message}`);
    }
  });

  // 6. 测试类别过滤
  console.log('\\n6. 类别过滤测试:');
  const chineseResult = garbledRecovery.quickRecover(garbledText, { 
    strategy: 'balanced', 
    category: 'chinese' 
  });
  
  if (chineseResult) {
    console.log('仅中文编码恢复:');
    console.log(`结果: ${chineseResult.recoveredText}`);
    console.log(`编码: ${chineseResult.sourceEncoding} -> ${chineseResult.targetEncoding}`);
    console.log(`可信度: ${chineseResult.credibility}`);
  } else {
    console.log('中文编码类别未找到合适结果');
  }

  console.log('\\n=== 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  testNewConfigSystem();
}

module.exports = { testNewConfigSystem };
