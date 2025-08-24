const TextCredibilityDetector = require('../src/text-credibility-detector');
const TestUtils = require('./test-utils');

describe('文本可信度检测器测试', () => {
  describe('基本功能测试', () => {
    test('应该正确计算正常中文文本的可信度', () => {
      const text = '这是一段正常的中文文本，包含常用汉字和标点符号。';
      const result = TextCredibilityDetector.calculateCredibility(text);

      expect(TestUtils.isValidCredibilityResult(result)).toBe(true);
      expect(result.score).toBeGreaterThan(70);
      expect(result.details.language).toBe('chinese');
    });

    test('应该正确计算正常英文文本的可信度', () => {
      const text = 'This is a normal English sentence with common words.';
      const result = TextCredibilityDetector.calculateCredibility(text);

      expect(TestUtils.isValidCredibilityResult(result)).toBe(true);
      expect(result.score).toBeGreaterThan(60);
      expect(result.details.language).toBe('english');
    });

    test('应该正确识别混合语言文本', () => {
      const text = 'Hello world! 你好世界！This is mixed content.';
      const result = TextCredibilityDetector.calculateCredibility(text);

      expect(TestUtils.isValidCredibilityResult(result)).toBe(true);
      expect(result.details.language).toBe('mixed');
    });

    test('应该给乱码文本较低的可信度得分', () => {
      const garbledTexts = [
        '������',
        'â€œâ€™â€â€ž',
        'àáâãäåæçèé',
        'aaaaaaaaaaaaaaaa'
      ];

      garbledTexts.forEach(text => {
        const result = TextCredibilityDetector.calculateCredibility(text);
        expect(result.score).toBeLessThan(40);
      });
    });
  });

  describe('输入验证测试', () => {
    test('应该处理空字符串', () => {
      const result = TextCredibilityDetector.calculateCredibility('');
      expect(result.score).toBe(0);
    });

    test('应该处理 null 输入', () => {
      const result = TextCredibilityDetector.calculateCredibility(null);
      expect(result.score).toBe(0);
      expect(result.details.error).toBeDefined();
    });

    test('应该处理 undefined 输入', () => {
      const result = TextCredibilityDetector.calculateCredibility(undefined);
      expect(result.score).toBe(0);
      expect(result.details.error).toBeDefined();
    });

    test('应该处理非字符串输入', () => {
      const inputs = [123, {}, [], true];
      inputs.forEach(input => {
        const result = TextCredibilityDetector.calculateCredibility(input);
        expect(result.score).toBe(0);
        expect(result.details.error).toBeDefined();
      });
    });
  });

  describe('文本分析功能测试', () => {
    test('analyzeText 应该正确统计字符', () => {
      const text = '这是English123，测试！';
      const stats = TextCredibilityDetector.analyzeText(text);

      expect(stats.length).toBe(text.length);
      expect(stats.chineseCount).toBe(4); // 这是测试
      expect(stats.englishCount).toBe(7); // English
      expect(stats.numberCount).toBe(3); // 123
      expect(stats.punctuationCount).toBe(2); // ，！
    });

    test('应该正确计算字符比例', () => {
      const text = '中文English';
      const stats = TextCredibilityDetector.analyzeText(text);

      expect(stats.chineseRatio).toBeCloseTo(2/9, 2);
      expect(stats.englishRatio).toBeCloseTo(7/9, 2);
    });
  });

  describe('语言检测测试', () => {
    test('应该正确检测中文文本', () => {
      const texts = [
        '这是纯中文文本',
        '中国人民站起来了',
        '汉字是中华文明的重要组成部分'
      ];

      texts.forEach(text => {
        const language = TextCredibilityDetector.detectPrimaryLanguage(text);
        expect(language).toBe('chinese');
      });
    });

    test('应该正确检测英文文本', () => {
      const texts = [
        'This is pure English text',
        'The quick brown fox jumps over the lazy dog',
        'JavaScript is a programming language'
      ];

      texts.forEach(text => {
        const language = TextCredibilityDetector.detectPrimaryLanguage(text);
        expect(language).toBe('english');
      });
    });

    test('应该正确检测混合文本', () => {
      const texts = [
        'Hello 世界',
        '这是 mixed content',
        'JavaScript 编程语言'
      ];

      texts.forEach(text => {
        const language = TextCredibilityDetector.detectPrimaryLanguage(text);
        expect(language).toBe('mixed');
      });
    });

    test('应该处理未知语言', () => {
      const texts = [
        '123456789',
        '!@#$%^&*()',
        '        '
      ];

      texts.forEach(text => {
        const language = TextCredibilityDetector.detectPrimaryLanguage(text);
        expect(language).toBe('unknown');
      });
    });
  });

  describe('频率得分计算测试', () => {
    test('常用字符应该获得较高的频率得分', () => {
      const commonText = '的一是在不了有和';
      const score = TextCredibilityDetector.calculateFrequencyScore(commonText);
      expect(score).toBeGreaterThan(50);
    });

    test('罕见字符应该获得较低的频率得分', () => {
      const rareText = '㍿㌻㍼㌰㍻';
      const score = TextCredibilityDetector.calculateFrequencyScore(rareText);
      expect(score).toBe(0); // 这些字符不在频率字典中
    });

    test('空文本应该返回0分', () => {
      const score = TextCredibilityDetector.calculateFrequencyScore('');
      expect(score).toBe(0);
    });
  });

  describe('语言一致性测试', () => {
    test('一致的中文文本应该获得高分', () => {
      const text = '这是一段完全由中文组成的文本内容';
      const score = TextCredibilityDetector.detectLanguageConsistency(text);
      expect(score).toBeGreaterThan(70);
    });

    test('一致的英文文本应该获得高分', () => {
      const text = 'This is a completely English text content';
      const score = TextCredibilityDetector.detectLanguageConsistency(text);
      expect(score).toBeGreaterThan(70);
    });

    test('混乱的字符组合应该获得低分', () => {
      const text = '�����âœâ€¢â����';
      const score = TextCredibilityDetector.detectLanguageConsistency(text);
      expect(score).toBeLessThan(30);
    });

    test('短文本应该获得中等分数', () => {
      const text = '短';
      const score = TextCredibilityDetector.detectLanguageConsistency(text);
      expect(score).toBe(50);
    });
  });

  describe('文本结构分析测试', () => {
    test('结构良好的文本应该获得高分', () => {
      const text = '这是一段结构良好的文本，包含适当的标点符号。';
      const score = TextCredibilityDetector.analyzeTextStructure(text);
      expect(score).toBeGreaterThan(60);
    });

    test('过多标点符号应该降低得分', () => {
      const text = '！！！？？？，，，。。。：：：；；；';
      const score = TextCredibilityDetector.analyzeTextStructure(text);
      expect(score).toBeLessThan(50);
    });

    test('连续重复字符应该降低得分', () => {
      const text = 'aaaaaaaaaa';
      const score = TextCredibilityDetector.analyzeTextStructure(text);
      expect(score).toBeLessThan(40);
    });

    test('包含替换字符应该降低得分', () => {
      const text = 'text with � replacement chars';
      const score = TextCredibilityDetector.analyzeTextStructure(text);
      expect(score).toBeLessThan(50);
    });

    test('空文本应该返回0分', () => {
      const score = TextCredibilityDetector.analyzeTextStructure('');
      expect(score).toBe(0);
    });
  });

  describe('综合评分测试', () => {
    test('正常文本样本应该获得合理的评分', () => {
      const samples = TestUtils.getNormalTextSamples();
      
      samples.forEach(sample => {
        const result = TextCredibilityDetector.calculateCredibility(sample.text);
        expect(result.score).toBeGreaterThanOrEqual(sample.expectedCredibility.min);
        expect(result.score).toBeLessThanOrEqual(sample.expectedCredibility.max);
        expect(result.details.language).toBe(sample.language);
      });
    });

    test('乱码样本应该获得较低评分', () => {
      const samples = TestUtils.getObviousGarbledSamples();
      
      samples.forEach(sample => {
        const result = TextCredibilityDetector.calculateCredibility(sample.text);
        expect(result.score).toBeGreaterThanOrEqual(sample.expectedCredibility.min);
        expect(result.score).toBeLessThanOrEqual(sample.expectedCredibility.max);
      });
    });
  });

  describe('性能测试', () => {
    test('应该能够快速处理长文本', () => {
      const longText = '这是一段很长的文本。'.repeat(1000);
      const startTime = Date.now();
      const result = TextCredibilityDetector.calculateCredibility(longText);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
      expect(TestUtils.isValidCredibilityResult(result)).toBe(true);
    });

    test('应该能够处理大量短文本', () => {
      const texts = Array.from({length: 100}, (_, i) => `测试文本${i}`);
      const startTime = Date.now();
      
      texts.forEach(text => {
        TextCredibilityDetector.calculateCredibility(text);
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // 应该在2秒内完成
    });
  });
});
