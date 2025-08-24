const GarbledTextRecovery = require('./garbled-text-recovery');
const TextCredibilityDetector = require('./text-credibility-detector');
const EncodingConfigManager = require('./encoding-config-manager');
const { combinedFrequency, chineseFrequency, englishFrequency } = require('./frequency-dict');

/**
 * 从乱码中恢复原文的主函数
 * @param {string} garbledText - 乱码文本
 * @param {Object} options - 配置选项
 * @param {number} options.maxResults - 最大返回结果数量 (默认: 10)
 * @param {number} options.minCredibility - 最小可信度阈值 (默认: 30)
 * @param {string} options.strategy - 转换策略: 'fast', 'balanced', 'aggressive' (默认: 'balanced')
 * @param {string} options.category - 编码类别过滤: 'chinese', 'western', 'japanese', 'korean'
 * @param {boolean} options.useRecommended - 是否使用智能推荐编码对 (默认: true)
 * @param {boolean} options.commonEncodingsOnly - 是否只使用常见编码 (向后兼容，默认: false)
 * @returns {Array} 恢复结果数组，每个元素包含：
 *   - sourceEncoding: 猜测的原编码
 *   - targetEncoding: 目标编码
 *   - recoveredText: 恢复出来的文本
 *   - credibility: 可信度得分 (0-100)
 *   - details: 详细信息
 *   - description: 编码转换描述
 */
function recoverFromGarbledText(garbledText, options = {}) {
  // 向后兼容：如果使用了旧的commonEncodingsOnly选项，转换为新的strategy选项
  if (options.commonEncodingsOnly && !options.strategy) {
    options.strategy = 'fast';
    delete options.commonEncodingsOnly;
  }
  
  return GarbledTextRecovery.recoverText(garbledText, options);
}

/**
 * 检测文本可信度
 * @param {string} text - 要检测的文本
 * @returns {Object} 包含得分和详细信息的对象
 */
function detectTextCredibility(text) {
  // 按公共入口的要求：null/undefined 视为错误，其它输入（包括空字符串）允许并返回结构化结果
  if (text === null || text === undefined) {
    throw new Error('输入必须是非空字符串');
  }
  return TextCredibilityDetector.calculateCredibility(text);
}

/**
 * 快速恢复函数 - 只返回最佳结果
 * @param {string} garbledText - 乱码文本
 * @param {Object} options - 配置选项
 * @returns {Object|null} 最佳恢复结果，如果没有找到合适结果则返回null
 */
function quickRecover(garbledText, options = {}) {
  const results = recoverFromGarbledText(garbledText, { 
    maxResults: 1, 
    strategy: options.strategy || 'fast',
    ...options
  });
  
  return results.length > 0 ? results[0] : null;
}

/**
 * 批量处理多个乱码文本
 * @param {string[]} garbledTexts - 乱码文本数组
 * @param {Object} options - 配置选项
 * @returns {Array} 恢复结果数组
 */
function batchRecover(garbledTexts, options = {}) {
  if (!Array.isArray(garbledTexts)) {
    throw new Error('输入必须是字符串数组');
  }

  return garbledTexts.map((text, index) => {
    try {
      const results = recoverFromGarbledText(text, options);
      const best = results && results.length > 0 ? results[0] : null;
      return {
        index,
        originalText: text,
        results,
        result: best,
        success: Array.isArray(results) && results.length > 0
      };
    } catch (error) {
      return {
        index,
        originalText: text,
        results: [],
        result: null,
        success: false,
        error: error.message
      };
    }
  });
}

/**
 * 获取支持的编码列表
 * @param {string} category - 编码类别 (可选)
 * @returns {Array} 编码列表
 */
function getSupportedEncodings(category = null) {
  const configManager = new EncodingConfigManager();
  if (category) {
    return configManager.config.supportedEncodings[category] || [];
  }
  return configManager.getAllSupportedEncodings();
}

/**
 * 获取可用的转换策略
 * @returns {Array} 策略列表
 */
function getAvailableStrategies() {
  const configManager = new EncodingConfigManager();
  return configManager.getAvailableStrategies();
}

/**
 * 检测文本可能的编码类型
 * @param {string} text - 输入文本
 * @returns {Array} 可能的编码类型
 */
function detectPossibleEncodings(text) {
  const configManager = new EncodingConfigManager();
  return configManager.detectPossibleEncodings(text);
}

/**
 * 获取编码对建议
 * @param {string} text - 输入文本
 * @param {Object} options - 配置选项
 * @returns {Array} 推荐的编码对
 */
function getRecommendedEncodingPairs(text, options = {}) {
  const configManager = new EncodingConfigManager();
  return configManager.getRecommendedEncodingPairs(text, options);
}

module.exports = {
  // 主要恢复方法
  recoverFromGarbledText,
  quickRecover,
  batchRecover,
  
  // 分析工具
  detectTextCredibility,
  detectPossibleEncodings,
  getRecommendedEncodingPairs,
  
  // 配置查询
  getSupportedEncodings,
  getAvailableStrategies,
  
  // 内部类 (供高级用户使用)
  GarbledTextRecovery,
  TextCredibilityDetector,
  EncodingConfigManager,
  
  // 频率数据 (向后兼容)
  frequency: {
    combined: combinedFrequency,
    chinese: chineseFrequency,
    english: englishFrequency
  }
};
