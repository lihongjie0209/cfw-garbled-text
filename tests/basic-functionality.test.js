const GarbledTextRecovery = require('../src/garbled-text-recovery');
const TextCredibilityDetector = require('../src/text-credibility-detector');

describe('Basic Functionality Tests', () => {
  describe('Garbled Text Recovery', () => {
    test('should have recoverText method', () => {
      expect(typeof GarbledTextRecovery.recoverText).toBe('function');
    });

    test('should return array of results', () => {
      const results = GarbledTextRecovery.recoverText('HÃ¤llo WÃ¶rld');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should recover simple ASCII garbled text', () => {
      const garbledText = 'Hello WÃ¶rld';
      const results = GarbledTextRecovery.recoverText(garbledText);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('sourceEncoding');
      expect(results[0]).toHaveProperty('targetEncoding');
      expect(results[0]).toHaveProperty('recoveredText');
      expect(results[0]).toHaveProperty('credibility');
    });

    test('should return results sorted by credibility', () => {
      const garbledText = 'HÃ¤llo';
      const results = GarbledTextRecovery.recoverText(garbledText);
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].credibility).toBeGreaterThanOrEqual(results[i].credibility);
      }
    });

    test('should handle file access error message with garbled Chinese text', () => {
      // 测试真实的IO错误信息乱码恢复
      // 这是一个真实的Windows系统错误信息乱码："另一个程序正在使用此文件"
      const garbledErrorMsg = 'IO Error: Cannot open file "maven_artifacts_thread_0.db": Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ£¬½ø³ÌÎ';
      const results = GarbledTextRecovery.recoverText(garbledErrorMsg);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // 检查最佳结果
      const bestResult = results[0];
      expect(bestResult).toHaveProperty('sourceEncoding');
      expect(bestResult).toHaveProperty('targetEncoding');
      expect(bestResult).toHaveProperty('recoveredText');
      expect(bestResult).toHaveProperty('credibility');
      expect(bestResult.credibility).toBeGreaterThan(0);
      
      // 检查是否包含中文字符
      const hasChinese = /[\u4e00-\u9fff]/.test(bestResult.recoveredText);
      
      console.log('File access error recovery test:');
      console.log('Original:', garbledErrorMsg.substring(0, 100) + '...');
      console.log('Recovered:', bestResult.recoveredText.substring(0, 100) + '...');
      console.log('Encoding:', `${bestResult.sourceEncoding} -> ${bestResult.targetEncoding}`);
      console.log('Credibility:', bestResult.credibility);
      console.log('Contains Chinese:', hasChinese);
      
      // 应该找到某种程度的恢复
      expect(bestResult.credibility).toBeGreaterThan(30);
    });

    test('should recover real world garbled error messages', () => {
      // 测试更多真实世界的乱码错误信息
      const testCases = [
        {
          name: 'Another program using file',
          garbled: 'Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ',
          description: '"另一个程序正在使用此文件" 的乱码版本'
        },
        {
          name: 'File not found',
          garbled: 'ÎļþδÕÒµ½',
          description: '"文件未找到" 的乱码版本'
        },
        {
          name: 'Access denied',
          garbled: '·ÃÎÊ±»¾Ü¾ø',
          description: '"访问被拒绝" 的乱码版本'
        }
      ];

      testCases.forEach(testCase => {
        const results = GarbledTextRecovery.recoverText(testCase.garbled);
        expect(Array.isArray(results)).toBe(true);
        
        if (results.length > 0) {
          const bestResult = results[0];
          expect(bestResult.credibility).toBeGreaterThan(0);
          
          console.log(`\n${testCase.name} (${testCase.description}):`);
          console.log('  输入乱码:', testCase.garbled);
          console.log('  最佳恢复:', bestResult.recoveredText);
          console.log('  编码转换:', `${bestResult.sourceEncoding} -> ${bestResult.targetEncoding}`);
          console.log('  可信度:', bestResult.credibility.toFixed(2));
          
          // 检查是否包含中文字符
          const hasChinese = /[\u4e00-\u9fff]/.test(bestResult.recoveredText);
          console.log('  包含中文:', hasChinese ? '是' : '否');
          
          // 至少应该有一定的可信度
          expect(bestResult.credibility).toBeGreaterThan(20);
        }
      });
    });
  });

  describe('Text Credibility Detector', () => {
    test('should have calculateCredibility method', () => {
      expect(typeof TextCredibilityDetector.calculateCredibility).toBe('function');
    });

    test('should return credibility score between 0 and 100', () => {
      const result = TextCredibilityDetector.calculateCredibility('Hello World');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('should give higher score to normal English text', () => {
      const normalResult = TextCredibilityDetector.calculateCredibility('Hello World');
      const gibberishResult = TextCredibilityDetector.calculateCredibility('xjkÃ§dfgh');
      
      expect(normalResult.score).toBeGreaterThan(gibberishResult.score);
    });

    test('should handle empty text', () => {
      const result = TextCredibilityDetector.calculateCredibility('');
      expect(result.score).toBe(0);
    });
  });

  describe('Module Integration', () => {
    test('main module should export all functions', () => {
      const mainModule = require('../src/index');
      
      expect(typeof mainModule.recoverFromGarbledText).toBe('function');
      expect(typeof mainModule.detectTextCredibility).toBe('function');
      expect(typeof mainModule.quickRecover).toBe('function');
      expect(typeof mainModule.batchRecover).toBe('function');
    });

    test('quickRecover should return best result', () => {
      const mainModule = require('../src/index');
      const result = mainModule.quickRecover('HÃ¤llo WÃ¶rld');
      
      expect(result).toHaveProperty('sourceEncoding');
      expect(result).toHaveProperty('targetEncoding');
      expect(result).toHaveProperty('recoveredText');
      expect(result).toHaveProperty('credibility');
    });

    test('batchRecover should handle multiple texts', () => {
      const mainModule = require('../src/index');
      const texts = ['HÃ¤llo', 'WÃ¶rld'];
      const results = mainModule.batchRecover(texts);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toHaveProperty('index');
        expect(result).toHaveProperty('originalText');
        expect(result).toHaveProperty('result');
        expect(result).toHaveProperty('success');
      });
    });
  });
});
