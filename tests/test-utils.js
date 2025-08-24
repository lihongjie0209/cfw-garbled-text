/**
 * 测试工具类
 * 提供测试数据生成和验证功能
 */
class TestUtils {
  /**
   * 生成测试用的乱码文本样本
   * @returns {Array} 测试样本数组
   */
  static getGarbledTextSamples() {
    return [
      {
        description: '中文GBK乱码',
        garbled: 'ä¸­æ–‡ä¹±ç ',
        expected: '中文乱码',
        expectedEncoding: { source: 'gbk', target: 'utf-8' }
      },
      {
        description: '中文UTF-8乱码',
        garbled: "æˆ'çˆ±ä¸­å›½",
        expected: '我爱中国',
        expectedEncoding: { source: 'gbk', target: 'utf-8' }
      },
      {
        description: '英文Latin-1乱码',
        garbled: 'HÃ¤llo WÃ¶rld',
        expected: 'Hällo Wörld',
        expectedEncoding: { source: 'iso-8859-1', target: 'utf-8' }
      },
      {
        description: '混合文本乱码',
        garbled: 'Hello ä¸­æ–‡',
        expected: 'Hello 中文',
        expectedEncoding: { source: 'gbk', target: 'utf-8' }
      },
      {
        description: '包含标点的中文乱码',
        garbled: 'ä½ å¥½ï¼Œä¸–ç•Œï¼',
        expected: '你好，世界！',
        expectedEncoding: { source: 'gbk', target: 'utf-8' }
      }
    ];
  }

  /**
   * 生成正常文本样本用于对比测试
   * @returns {Array} 正常文本样本
   */
  static getNormalTextSamples() {
    return [
      {
        text: '这是一段正常的中文文本。',
        language: 'chinese',
        expectedCredibility: { min: 80, max: 100 }
      },
      {
        text: 'This is a normal English sentence.',
        language: 'english',
        expectedCredibility: { min: 75, max: 100 }
      },
      {
        text: 'Hello world! 你好世界！',
        language: 'mixed',
        expectedCredibility: { min: 70, max: 100 }
      },
      {
        text: '123456789',
        language: 'unknown',
        expectedCredibility: { min: 20, max: 60 }
      },
      {
        text: '',
        language: 'unknown',
        expectedCredibility: { min: 0, max: 10 }
      }
    ];
  }

  /**
   * 生成明显乱码样本
   * @returns {Array} 乱码样本
   */
  static getObviousGarbledSamples() {
    return [
      {
        text: '������',
        expectedCredibility: { min: 0, max: 20 }
      },
      {
        text: 'â€œâ€™â€â€ž',
        expectedCredibility: { min: 0, max: 30 }
      },
      {
        text: 'àáâãäåæçèé',
        expectedCredibility: { min: 10, max: 40 }
      },
      {
        text: '!@#$%^&*()_+{}|:"<>?',
        expectedCredibility: { min: 0, max: 25 }
      },
      {
        text: 'aaaaaaaaaaaaaaaa',
        expectedCredibility: { min: 0, max: 30 }
      }
    ];
  }

  /**
   * 验证恢复结果是否合理
   * @param {Array} results - 恢复结果
   * @param {Object} expected - 期望结果
   * @returns {boolean} 是否通过验证
   */
  static validateRecoveryResults(results, expected = {}) {
    if (!Array.isArray(results)) {
      return false;
    }

    // 检查结果结构
    for (const result of results) {
      if (!this.isValidRecoveryResult(result)) {
        return false;
      }
    }

    // 检查排序（按可信度降序）
    for (let i = 1; i < results.length; i++) {
      if (results[i].credibility > results[i - 1].credibility) {
        return false;
      }
    }

    // 如果有期望的编码，检查是否包含
    if (expected.encoding) {
      const hasExpectedEncoding = results.some(result => 
        result.sourceEncoding === expected.encoding.source &&
        result.targetEncoding === expected.encoding.target
      );
      if (!hasExpectedEncoding) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证单个恢复结果的结构
   * @param {Object} result - 恢复结果
   * @returns {boolean} 是否有效
   */
  static isValidRecoveryResult(result) {
    const requiredFields = [
      'sourceEncoding',
      'targetEncoding', 
      'recoveredText',
      'credibility',
      'details'
    ];

    for (const field of requiredFields) {
      if (!(field in result)) {
        return false;
      }
    }

    // 检查数据类型
    if (typeof result.sourceEncoding !== 'string' ||
        typeof result.targetEncoding !== 'string' ||
        typeof result.recoveredText !== 'string' ||
        typeof result.credibility !== 'number' ||
        typeof result.details !== 'object') {
      return false;
    }

    // 检查可信度范围
    if (result.credibility < 0 || result.credibility > 100) {
      return false;
    }

    return true;
  }

  /**
   * 验证可信度检测结果
   * @param {Object} credibilityResult - 可信度检测结果
   * @returns {boolean} 是否有效
   */
  static isValidCredibilityResult(credibilityResult) {
    if (!credibilityResult || typeof credibilityResult !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!('score' in credibilityResult) || !('details' in credibilityResult)) {
      return false;
    }

    // 检查得分范围
    if (typeof credibilityResult.score !== 'number' ||
        credibilityResult.score < 0 ||
        credibilityResult.score > 100) {
      return false;
    }

    // 检查详细信息结构
    const details = credibilityResult.details;
    if (!details || typeof details !== 'object') {
      return false;
    }

    const requiredDetailFields = [
      'frequencyScore',
      'languageScore', 
      'structureScore',
      'stats',
      'language'
    ];

    for (const field of requiredDetailFields) {
      if (!(field in details)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 生成性能测试数据
   * @param {number} count - 生成数量
   * @returns {Array} 测试数据
   */
  static generatePerformanceTestData(count = 100) {
    const data = [];
    const templates = [
  'ä¸­æ–‡ä¹±ç ',
  "æˆ'çˆ±ä¸­å›½",
      'Hello Worldï¼Œè¿™æ˜¯ä¸€ä¸ªæµ‹è¯•',
      'çš„ä¸€æ˜¯åœ¨ä¸'
    ];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const variation = template + String(i).repeat(Math.floor(i / 10) + 1);
      data.push(variation);
    }

    return data;
  }
}

module.exports = TestUtils;
