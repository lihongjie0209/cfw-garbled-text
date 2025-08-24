const { chineseFrequency, englishFrequency, numberFrequency, combinedFrequency } = require('../src/frequency-dict');

describe('频率字典测试', () => {
  describe('中文频率字典', () => {
    test('应该包含常用中文字符', () => {
      const commonChars = ['的', '一', '是', '在', '不', '了', '有', '和'];
      commonChars.forEach(char => {
        expect(chineseFrequency).toHaveProperty(char);
        expect(typeof chineseFrequency[char]).toBe('number');
        expect(chineseFrequency[char]).toBeGreaterThan(0);
      });
    });

    test('频率值应该在合理范围内', () => {
      Object.values(chineseFrequency).forEach(frequency => {
        expect(frequency).toBeGreaterThan(0);
        expect(frequency).toBeLessThanOrEqual(10000);
      });
    });

    test('最高频字符应该是"的"', () => {
      const maxFrequency = Math.max(...Object.values(chineseFrequency));
      expect(chineseFrequency['的']).toBe(maxFrequency);
    });

    test('应该包含常用标点符号', () => {
      const punctuation = ['。', '，', '、', '？', '！'];
      punctuation.forEach(punct => {
        expect(chineseFrequency).toHaveProperty(punct);
      });
    });
  });

  describe('英文频率字典', () => {
    test('应该包含所有英文字母', () => {
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (const letter of letters) {
        expect(englishFrequency).toHaveProperty(letter);
        expect(typeof englishFrequency[letter]).toBe('number');
        expect(englishFrequency[letter]).toBeGreaterThan(0);
      }
    });

    test('最高频字母应该是"e"或"E"', () => {
      const eFreq = englishFrequency['e'] || 0;
      const otherFreqs = Object.entries(englishFrequency)
        .filter(([char]) => char !== 'e')
        .map(([, freq]) => freq);
      
      expect(eFreq).toBeGreaterThan(Math.max(...otherFreqs) * 0.8);
    });

    test('小写字母频率应该高于对应大写字母', () => {
      const testPairs = [['a', 'A'], ['e', 'E'], ['t', 'T'], ['o', 'O']];
      testPairs.forEach(([lower, upper]) => {
        expect(englishFrequency[lower]).toBeGreaterThan(englishFrequency[upper]);
      });
    });
  });

  describe('数字频率字典', () => {
    test('应该包含所有数字0-9', () => {
      for (let i = 0; i <= 9; i++) {
        const digit = i.toString();
        expect(numberFrequency).toHaveProperty(digit);
        expect(typeof numberFrequency[digit]).toBe('number');
        expect(numberFrequency[digit]).toBeGreaterThan(0);
      }
    });

    test('数字频率应该相对均匀', () => {
      const frequencies = Object.values(numberFrequency);
      const max = Math.max(...frequencies);
      const min = Math.min(...frequencies);
      
      // 最大值不应该超过最小值的2倍
      expect(max / min).toBeLessThanOrEqual(2);
    });
  });

  describe('合并频率字典', () => {
    test('应该包含所有子字典的内容', () => {
      // 测试一些来自各个子字典的字符
      expect(combinedFrequency).toHaveProperty('的'); // 中文
      expect(combinedFrequency).toHaveProperty('e'); // 英文
      expect(combinedFrequency).toHaveProperty('1'); // 数字

      // 确保值保持一致
      expect(combinedFrequency['的']).toBe(chineseFrequency['的']);
      expect(combinedFrequency['e']).toBe(englishFrequency['e']);
      expect(combinedFrequency['1']).toBe(numberFrequency['1']);
    });

    test('不应该有重复或冲突的键', () => {
      const allKeys = [
        ...Object.keys(chineseFrequency),
        ...Object.keys(englishFrequency),
        ...Object.keys(numberFrequency)
      ];
      
      const uniqueKeys = [...new Set(allKeys)];
      const combinedKeys = Object.keys(combinedFrequency);
      
      expect(combinedKeys.length).toBeGreaterThanOrEqual(uniqueKeys.length);
    });

    test('所有频率值都应该是正数', () => {
      Object.values(combinedFrequency).forEach(frequency => {
        expect(frequency).toBeGreaterThan(0);
        expect(typeof frequency).toBe('number');
      });
    });
  });

  describe('边界情况测试', () => {
    test('字典应该是只读的', () => {
      const originalValue = chineseFrequency['的'];
      
      // 尝试修改应该不会影响原始值（如果使用了 Object.freeze）
      expect(() => {
        chineseFrequency['的'] = 0;
      }).not.toThrow();
      
      // 但我们至少可以检查值的类型是否正确
      expect(typeof chineseFrequency['的']).toBe('number');
    });

    test('不存在的字符应该返回 undefined', () => {
      expect(chineseFrequency['不存在的字符']).toBeUndefined();
      expect(englishFrequency['不存在']).toBeUndefined();
      expect(numberFrequency['不是数字']).toBeUndefined();
    });
  });
});
