const recovery = require('./index');

// 测试原始的乱码错误信息
const originalMsg = 'IO Error: Cannot open file "maven_artifacts_thread_0.db": Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ£¬½ø³ÌÎ';

console.log('=== 乱码错误信息恢复测试 ===');
console.log('原始错误信息:', originalMsg);
console.log();

const results = recovery.recoverFromGarbledText(originalMsg);
console.log('找到', results.length, '个可能的恢复结果:');
console.log();

results.slice(0, 5).forEach((result, index) => {
  console.log(`结果 ${index + 1}:`);
  console.log('  恢复文本:', result.recoveredText);
  console.log('  编码转换:', `${result.sourceEncoding} -> ${result.targetEncoding}`);
  console.log('  可信度:', result.credibility.toFixed(2));
  console.log('  语言:', result.details?.language || 'unknown');
  console.log();
});

// 使用快速恢复
const quickResult = recovery.quickRecover(originalMsg);
console.log('=== 快速恢复结果 ===');
console.log('最佳恢复:', quickResult.recoveredText);
console.log('可信度:', quickResult.credibility.toFixed(2));
console.log('编码:', `${quickResult.sourceEncoding} -> ${quickResult.targetEncoding}`);

// 测试其他常见的错误信息乱码
console.log('\n=== 其他错误信息测试 ===');

const testCases = [
  'Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ',  // "另一个程序正在使用此文件"
  'ÎļþδÕÒµ½',  // "文件未找到"
  '·ÃÎÊ±»¾Ü¾ø',  // "访问被拒绝"
  'ÈÏȨʧ°Ü',  // "认权失败"
];

testCases.forEach((garbled, index) => {
  console.log(`\n测试案例 ${index + 1}: "${garbled}"`);
  const result = recovery.quickRecover(garbled);
  if (result) {
    console.log('  恢复结果:', result.recoveredText);
    console.log('  可信度:', result.credibility.toFixed(2));
    console.log('  编码转换:', `${result.sourceEncoding} -> ${result.targetEncoding}`);
  } else {
    console.log('  未找到合适的恢复结果');
  }
});

console.log('\n=== 测试完成 ===');
