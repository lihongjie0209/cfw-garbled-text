const iconv = require('iconv-lite');

// 测试原始乱码的各种编码转换
const garbledText = 'Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ';
console.log('原始乱码:', garbledText);
console.log('分析: 这看起来像是GBK编码的中文被错误地当作其他编码显示');
console.log();

// 尝试各种编码转换
const encodings = ['gbk', 'gb2312', 'big5', 'utf-8', 'iso-8859-1', 'windows-1252'];

console.log('=== 尝试所有编码转换组合 ===');
let foundValidResults = [];

encodings.forEach(sourceEnc => {
  encodings.forEach(targetEnc => {
    if (sourceEnc !== targetEnc) {
      try {
        // 先将文本按源编码解码为buffer，再按目标编码编码为字符串
        const bytes = iconv.encode(garbledText, sourceEnc);
        const result = iconv.decode(bytes, targetEnc);
        
        if (result !== garbledText && !result.includes('�') && result.length > 0) {
          const hasChineseChars = /[\u4e00-\u9fff]/.test(result);
          if (hasChineseChars || result.includes('文件') || result.includes('程序') || result.includes('使用')) {
            foundValidResults.push({
              source: sourceEnc,
              target: targetEnc,
              result: result,
              hasChinese: hasChineseChars
            });
          }
          console.log(`${sourceEnc} -> ${targetEnc}: ${result}`);
        }
      } catch (e) {
        // 忽略编码错误
      }
    }
  });
});

console.log('\n=== 包含中文字符的有效结果 ===');
foundValidResults
  .filter(r => r.hasChinese)
  .forEach(r => {
    console.log(`✓ ${r.source} -> ${r.target}: ${r.result}`);
  });

// 测试一个已知的正确转换（如果我们知道原始编码）
console.log('\n=== 手动测试已知转换 ===');

// 假设原始文本是"另一个程序正在使用此文件"，看看它在不同编码下是什么样子
const originalChinese = '另一个程序正在使用此文件';
console.log('原始中文:', originalChinese);

encodings.forEach(enc => {
  try {
    const encoded = iconv.encode(originalChinese, 'utf-8');
    const decoded = iconv.decode(encoded, enc);
    if (decoded !== originalChinese) {
      console.log(`UTF-8 -> ${enc}: ${decoded}`);
      
      // 检查是否匹配我们的乱码
      if (decoded.includes('Áí') || decoded.includes('³Ì')) {
        console.log('  ★ 这个可能匹配我们的乱码!');
      }
    }
  } catch (e) {
    // 忽略
  }
});

console.log('\n=== 反向测试：从乱码推断原始文本 ===');
// 尝试将乱码作为特定编码的字节序列来解释
try {
  // 假设乱码是windows-1252编码的中文GBK字节
  const gbkBytes = iconv.encode(garbledText, 'windows-1252');
  const chineseResult = iconv.decode(gbkBytes, 'gbk');
  console.log('Windows-1252 -> GBK:', chineseResult);
  
  if (/[\u4e00-\u9fff]/.test(chineseResult)) {
    console.log('✓ 成功恢复出中文字符!');
  }
} catch (e) {
  console.log('转换失败:', e.message);
}
