const encodingConfig = require('./encoding-config.json');

/**
 * 编码配置管理器
 * 负责加载和管理编码转换的配置
 */
class EncodingConfigManager {
  constructor() {
    this.config = encodingConfig;
  }

  /**
   * 获取编码对列表
   * @param {Object} options - 配置选项
   * @param {boolean} options.commonOnly - 是否只返回常用编码
   * @param {string} options.strategy - 转换策略: 'fast', 'balanced', 'aggressive'
   * @param {string} options.category - 编码类别过滤: 'chinese', 'western', 'japanese', 'korean'
   * @returns {Array} 编码对数组
   */
  getEncodingPairs(options = {}) {
    const {
      commonOnly = false,
      strategy = 'balanced',
      category = null
    } = options;

    let pairs = [];

    // 根据策略选择编码对
    if (strategy === 'fast' || commonOnly) {
      pairs = [...this.config.commonPairs];
    } else if (strategy === 'balanced') {
      pairs = [...this.config.commonPairs, ...this.config.extendedPairs];
    } else if (strategy === 'aggressive') {
      pairs = [...this.config.commonPairs, ...this.config.extendedPairs];
      // 在aggressive模式下，还可以动态生成更多组合
      pairs = pairs.concat(this.generateDynamicPairs());
    }

    // 按类别过滤
    if (category) {
      pairs = pairs.filter(pair => pair.category === category);
    }

    // 按优先级排序
    pairs.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    // 根据策略限制数量
    const strategyConfig = this.config.conversionStrategies[strategy];
    if (strategyConfig && strategyConfig.maxAttempts) {
      pairs = pairs.slice(0, strategyConfig.maxAttempts);
    }

    return pairs;
  }

  /**
   * 动态生成编码对（用于aggressive策略）
   * @returns {Array} 动态生成的编码对
   */
  generateDynamicPairs() {
    const dynamicPairs = [];
    const allEncodings = this.getAllSupportedEncodings();

    // 生成所有可能的编码组合
    for (let i = 0; i < allEncodings.length; i++) {
      for (let j = 0; j < allEncodings.length; j++) {
        if (i !== j) {
          const sourceEncoding = allEncodings[i];
          const targetEncoding = allEncodings[j];
          
          // 避免重复
          const exists = this.config.commonPairs.some(pair => 
            pair.sourceEncoding === sourceEncoding && pair.targetEncoding === targetEncoding
          ) || this.config.extendedPairs.some(pair => 
            pair.sourceEncoding === sourceEncoding && pair.targetEncoding === targetEncoding
          );

          if (!exists) {
            dynamicPairs.push({
              sourceEncoding,
              targetEncoding,
              description: `${sourceEncoding}被误认为${targetEncoding}`,
              priority: 10,
              category: 'dynamic'
            });
          }
        }
      }
    }

    return dynamicPairs;
  }

  /**
   * 获取所有支持的编码
   * @returns {Array} 编码数组
   */
  getAllSupportedEncodings() {
    const encodings = new Set();
    
    Object.values(this.config.supportedEncodings).forEach(encodingList => {
      encodingList.forEach(encoding => encodings.add(encoding));
    });

    return Array.from(encodings);
  }

  /**
   * 获取字符替换映射
   * @param {string} mapType - 映射类型
   * @returns {Object} 字符替换映射
   */
  getCharReplacementMap(mapType) {
    return this.config.charReplacementMaps[mapType] || {};
  }

  /**
   * 获取所有字符替换映射
   * @returns {Object} 所有字符替换映射
   */
  getAllCharReplacementMaps() {
    return this.config.charReplacementMaps;
  }

  /**
   * 检测文本可能的编码类型
   * @param {string} text - 输入文本
   * @returns {Array} 可能的编码类型数组
   */
  detectPossibleEncodings(text) {
    const possibleEncodings = [];

    // 检查中文指示符
    const chineseIndicators = this.config.autoDetectionRules.chineseIndicators;
    const hasChineseIndicators = chineseIndicators.some(indicator => text.includes(indicator));
    
    if (hasChineseIndicators) {
      possibleEncodings.push('chinese');
    }

    // 检查拉丁文指示符
    const latinIndicators = this.config.autoDetectionRules.latinIndicators;
    const hasLatinIndicators = latinIndicators.some(indicator => text.includes(indicator));
    
    if (hasLatinIndicators) {
      possibleEncodings.push('western');
    }

    // 检查Unicode替换字符
    const replacementChars = this.config.autoDetectionRules.unicodeReplacementChars;
    const hasReplacementChars = replacementChars.some(char => text.includes(char));
    
    if (hasReplacementChars) {
      possibleEncodings.push('unicode_errors');
    }

    // 如果没有检测到特定指示符，返回所有类型
    if (possibleEncodings.length === 0) {
      possibleEncodings.push('chinese', 'western', 'japanese', 'korean');
    }

    return possibleEncodings;
  }

  /**
   * 根据文本内容获取推荐的编码对
   * @param {string} text - 输入文本
   * @param {Object} options - 配置选项
   * @returns {Array} 推荐的编码对
   */
  getRecommendedEncodingPairs(text, options = {}) {
    const possibleEncodings = this.detectPossibleEncodings(text);
    const allPairs = this.getEncodingPairs(options);

    // 根据检测到的编码类型过滤编码对
    const recommendedPairs = allPairs.filter(pair => {
      return possibleEncodings.includes(pair.category) || pair.category === 'dynamic';
    });

    // 如果有中文指示符，优先处理中文编码
    if (possibleEncodings.includes('chinese')) {
      return recommendedPairs.sort((a, b) => {
        const aIsChinese = a.category === 'chinese' ? 0 : 1;
        const bIsChinese = b.category === 'chinese' ? 0 : 1;
        if (aIsChinese !== bIsChinese) {
          return aIsChinese - bIsChinese;
        }
        return (a.priority || 999) - (b.priority || 999);
      });
    }

    return recommendedPairs;
  }

  /**
   * 获取转换策略配置
   * @param {string} strategyName - 策略名称
   * @returns {Object} 策略配置
   */
  getStrategyConfig(strategyName) {
    return this.config.conversionStrategies[strategyName] || this.config.conversionStrategies.balanced;
  }

  /**
   * 获取所有可用的转换策略
   * @returns {Array} 策略名称数组
   */
  getAvailableStrategies() {
    return Object.keys(this.config.conversionStrategies);
  }

  /**
   * 验证编码是否受支持
   * @param {string} encoding - 编码名称
   * @returns {boolean} 是否支持
   */
  isEncodingSupported(encoding) {
    const allEncodings = this.getAllSupportedEncodings();
    return allEncodings.includes(encoding);
  }

  /**
   * 获取编码的详细信息
   * @param {string} encoding - 编码名称
   * @returns {Object} 编码详细信息
   */
  getEncodingInfo(encoding) {
    for (const [category, encodings] of Object.entries(this.config.supportedEncodings)) {
      if (encodings.includes(encoding)) {
        return {
          encoding,
          category,
          supported: true
        };
      }
    }
    
    return {
      encoding,
      category: 'unknown',
      supported: false
    };
  }
}

module.exports = EncodingConfigManager;
