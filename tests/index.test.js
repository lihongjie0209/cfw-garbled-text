const { 
  recoverFromGarbledText, 
  detectTextCredibility, 
  quickRecover, 
  batchRecover,
  GarbledTextRecovery,
  TextCredibilityDetector,
  frequency
} = require('../src/index');
const TestUtils = require('./test-utils');

describe('主入口文件测试', () => {
  describe('模块导出测试', () => {
    test('应该导出所有必需的函数和类', () => {
      expect(typeof recoverFromGarbledText).toBe('function');
      expect(typeof detectTextCredibility).toBe('function');
      expect(typeof quickRecover).toBe('function');
      expect(typeof batchRecover).toBe('function');
      expect(typeof GarbledTextRecovery).toBe('function');
      expect(typeof TextCredibilityDetector).toBe('function');
      expect(typeof frequency).toBe('object');
    });

    test('频率字典应该包含所有子字典', () => {
      expect(frequency).toHaveProperty('combined');
      expect(frequency).toHaveProperty('chinese');
      expect(frequency).toHaveProperty('english');
      expect(typeof frequency.combined).toBe('object');
      expect(typeof frequency.chinese).toBe('object');
      expect(typeof frequency.english).toBe('object');
    });
  });

  describe('recoverFromGarbledText 函数测试', () => {
    test('应该正确调用底层恢复功能', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const results = recoverFromGarbledText(garbledText);

      expect(Array.isArray(results)).toBe(true);
      expect(TestUtils.validateRecoveryResults(results)).toBe(true);
    });

    test('应该支持配置选项', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const options = { maxResults: 3, minCredibility: 50 };
      const results = recoverFromGarbledText(garbledText, options);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
      results.forEach(result => {
        expect(result.credibility).toBeGreaterThanOrEqual(50);
      });
    });

    test('应该处理空选项对象', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const results = recoverFromGarbledText(garbledText, {});

      expect(Array.isArray(results)).toBe(true);
    });

    test('应该处理缺省选项', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const results = recoverFromGarbledText(garbledText);

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('detectTextCredibility 函数测试', () => {
    test('应该正确检测文本可信度', () => {
      const text = '这是一段正常的中文文本';
      const result = detectTextCredibility(text);

      expect(TestUtils.isValidCredibilityResult(result)).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    test('应该处理各种输入类型', () => {
      const inputs = ['正常文本', '', 'ä¸­æ–‡ä¹±ç ', '123456'];
      
      inputs.forEach(input => {
        const result = detectTextCredibility(input);
        expect(TestUtils.isValidCredibilityResult(result)).toBe(true);
      });
    });
  });

  describe('quickRecover 函数测试', () => {
    test('应该返回最佳恢复结果', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const result = quickRecover(garbledText);

      if (result) {
        expect(TestUtils.isValidRecoveryResult(result)).toBe(true);
        expect(result.credibility).toBeGreaterThan(0);
      } else {
        // 如果没有找到合适的结果，应该返回 null
        expect(result).toBeNull();
      }
    });

    test('应该在无法恢复时返回 null', () => {
      const normalText = '这是正常文本，不需要恢复';
      const result = quickRecover(normalText);

      // 对于正常文本，通常不会产生高可信度的恢复结果
      // 所以可能返回 null
      expect(result === null || TestUtils.isValidRecoveryResult(result)).toBe(true);
    });

    test('应该只使用常见编码以提高速度', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const startTime = Date.now();
      const result = quickRecover(garbledText);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // 应该在3秒内完成
    });
  });

  describe('batchRecover 函数测试', () => {
    test('应该处理字符串数组', () => {
      const garbledTexts = [
        'ä¸­æ–‡ä¹±ç ',
        'æˆ'çˆ±ä¸­å›½',
        '这是正常文本'
      ];
      
      const results = batchRecover(garbledTexts);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(garbledTexts.length);

      results.forEach((result, index) => {
        expect(result).toHaveProperty('index');
        expect(result).toHaveProperty('originalText');
        expect(result).toHaveProperty('results');
        expect(result).toHaveProperty('success');
        expect(result.index).toBe(index);
        expect(result.originalText).toBe(garbledTexts[index]);
        expect(Array.isArray(result.results)).toBe(true);
        expect(typeof result.success).toBe('boolean');
      });
    });

    test('应该处理空数组', () => {
      const results = batchRecover([]);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('应该处理包含各种文本的数组', () => {
      const mixedTexts = [
        'ä¸­æ–‡ä¹±ç ',
        '正常中文',
        'Normal English',
        '',
        '123456',
        'ãäåæçèé'
      ];

      const results = batchRecover(mixedTexts);

      expect(results.length).toBe(mixedTexts.length);
      results.forEach(result => {
        expect(typeof result.success).toBe('boolean');
        if (!result.success && result.error) {
          expect(typeof result.error).toBe('string');
        }
      });
    });

    test('应该支持配置选项', () => {
      const garbledTexts = ['ä¸­æ–‡ä¹±ç ', 'æˆ'çˆ±ä¸­å›½'];
      const options = { maxResults: 2, minCredibility: 60 };
      const results = batchRecover(garbledTexts, options);

      expect(results.length).toBe(garbledTexts.length);
      results.forEach(result => {
        if (result.success && result.results.length > 0) {
          expect(result.results.length).toBeLessThanOrEqual(2);
          result.results.forEach(recoveryResult => {
            expect(recoveryResult.credibility).toBeGreaterThanOrEqual(60);
          });
        }
      });
    });

    test('应该拒绝非数组输入', () => {
      const invalidInputs = ['string', 123, {}, null, undefined];
      
      invalidInputs.forEach(input => {
        expect(() => {
          batchRecover(input);
        }).toThrow('输入必须是字符串数组');
      });
    });

    test('应该处理数组中的错误输入', () => {
      const invalidTexts = [null, undefined, 123, {}, []];
      const results = batchRecover(invalidTexts);

      expect(results.length).toBe(invalidTexts.length);
      results.forEach(result => {
        // 应该有错误信息或者空结果
        expect(result.success === false || result.results.length === 0).toBe(true);
      });
    });
  });

  describe('集成测试', () => {
    test('不同函数应该产生一致的结果', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      
      const fullResults = recoverFromGarbledText(garbledText);
      const quickResult = quickRecover(garbledText);
      const batchResults = batchRecover([garbledText]);

      // 快速恢复的结果应该在完整结果中
      if (quickResult && fullResults.length > 0) {
        expect(fullResults[0].recoveredText).toBe(quickResult.recoveredText);
        expect(fullResults[0].credibility).toBe(quickResult.credibility);
      }

      // 批量处理的结果应该与单独处理一致
      if (batchResults.length > 0 && batchResults[0].success) {
        const batchResult = batchResults[0].results;
        expect(batchResult.length).toBeLessThanOrEqual(fullResults.length);
        
        if (batchResult.length > 0 && fullResults.length > 0) {
          expect(batchResult[0].recoveredText).toBe(fullResults[0].recoveredText);
        }
      }
    });

    test('可信度检测应该与恢复结果一致', () => {
      const garbledText = 'ä¸­æ–‡ä¹±ç ';
      const originalCredibility = detectTextCredibility(garbledText);
      const recoveryResults = recoverFromGarbledText(garbledText);

      // 原始乱码的可信度应该较低
      expect(originalCredibility.score).toBeLessThan(70);

      // 恢复结果的可信度应该更高
      recoveryResults.forEach(result => {
        expect(result.credibility).toBeGreaterThanOrEqual(originalCredibility.score);
      });
    });
  });

  describe('错误处理测试', () => {
    test('应该优雅地处理各种错误情况', () => {
      const errorCases = [
        () => recoverFromGarbledText(null),
        () => recoverFromGarbledText(undefined),
        () => recoverFromGarbledText(''),
        () => detectTextCredibility(null),
        () => quickRecover(null),
        () => batchRecover('not an array')
      ];

      errorCases.forEach(testCase => {
        expect(() => testCase()).toThrow();
      });
    });

    test('应该在出错时提供有意义的错误信息', () => {
      try {
        recoverFromGarbledText(null);
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('输入必须是非空字符串');
      }

      try {
        batchRecover('not an array');
        fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toContain('输入必须是字符串数组');
      }
    });
  });

  describe('性能测试', () => {
    test('所有函数都应该在合理时间内完成', () => {
      const testData = TestUtils.generatePerformanceTestData(10);
      const startTime = Date.now();

      // 测试各个函数的性能
      testData.forEach(text => {
        try {
          detectTextCredibility(text);
          quickRecover(text);
        } catch (error) {
          // 忽略错误，专注于性能测试
        }
      });

      // 测试批量处理性能
      try {
        batchRecover(testData.slice(0, 5));
      } catch (error) {
        // 忽略错误
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(10000); // 应该在10秒内完成
    });
  });
});
