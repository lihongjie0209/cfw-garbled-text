const TextCredibilityDetector = require('./text-credibility-detector');
const EncodingConfigManager = require('./encoding-config-manager');

/**
 * 乱码文本恢复器
 * 尝试各种编码组合来恢复乱码文本
 */
class GarbledTextRecovery {
  constructor() {
    this.configManager = new EncodingConfigManager();
  }

  /**
   * 从乱码中恢复原文
   * @param {string} garbledText - 乱码文本
   * @param {Object} options - 配置选项
   * @returns {Array} 恢复结果数组，按可信度排序
   */
  static recoverText(garbledText, options = {}) {
    const instance = new GarbledTextRecovery();
    return instance.recover(garbledText, options);
  }

  /**
   * 恢复实例方法
   * @param {string} garbledText - 乱码文本
   * @param {Object} options - 配置选项
   * @returns {Array} 恢复结果数组，按可信度排序
   */
  recover(garbledText, options = {}) {
    const {
      maxResults = 10,
      minCredibility = 30,
      strategy = 'balanced', // 'fast', 'balanced', 'aggressive'
      category = null,
      useRecommended = true
    } = options;

    if (!garbledText || typeof garbledText !== 'string') {
      throw new Error('输入必须是非空字符串');
    }

    const results = [];
    
    // 根据选项获取编码对
    let encodingPairs;
    if (useRecommended) {
      encodingPairs = this.configManager.getRecommendedEncodingPairs(garbledText, { strategy, category });
    } else {
      encodingPairs = this.configManager.getEncodingPairs({ strategy, category });
    }

    console.log(`使用策略: ${strategy}, 尝试 ${encodingPairs.length} 个编码对`);

    // 尝试不同的编码转换组合
    for (const { sourceEncoding, targetEncoding, description } of encodingPairs) {
      try {
        const recovered = this.tryRecovery(garbledText, sourceEncoding, targetEncoding);
        
        if (recovered && recovered !== garbledText) {
          const credibility = TextCredibilityDetector.calculateCredibility(recovered);
          
          if (credibility.score >= minCredibility) {
            results.push({
              sourceEncoding,
              targetEncoding,
              recoveredText: recovered,
              credibility: credibility.score,
              details: credibility.details,
              description: description || `${sourceEncoding} -> ${targetEncoding}`
            });
          }
        }
      } catch (error) {
        // 忽略转换错误，继续尝试其他编码
        continue;
      }
    }

    // 按可信度排序
    results.sort((a, b) => b.credibility - a.credibility);

    // 返回指定数量的结果
    return results.slice(0, maxResults);
  }

  /**
   * 尝试特定编码对的恢复
   * @param {string} text - 原始文本
   * @param {string} sourceEncoding - 源编码
   * @param {string} targetEncoding - 目标编码
   * @returns {string} 恢复的文本
   */
  tryRecovery(text, sourceEncoding, targetEncoding) {
    try {
      // 模拟编码转换过程
      // 在实际环境中，这里会使用 iconv-lite 或类似库
      if (this.isNodeEnvironment()) {
        return this.tryRecoveryWithIconv(text, sourceEncoding, targetEncoding);
      } else {
        return this.tryRecoveryWithTextEncoder(text, sourceEncoding, targetEncoding);
      }
    } catch (error) {
      throw new Error(`编码转换失败: ${sourceEncoding} -> ${targetEncoding}`);
    }
  }

  /**
   * 使用 iconv-lite 进行编码转换 (Node.js 环境)
   * @param {string} text 
   * @param {string} sourceEncoding 
   * @param {string} targetEncoding 
   * @returns {string}
   */
  tryRecoveryWithIconv(text, sourceEncoding, targetEncoding) {
    try {
      const iconv = require('iconv-lite');
      
      // 将文本按照错误的编码进行编码，然后用正确的编码解码
      const buffer = iconv.encode(text, sourceEncoding);
      const recovered = iconv.decode(buffer, targetEncoding);
      
      return recovered;
    } catch (error) {
      // 如果 iconv-lite 不可用，回退到简单方法
      return this.tryRecoveryWithTextEncoder(text, sourceEncoding, targetEncoding);
    }
  }

  /**
   * 使用 TextEncoder/TextDecoder 进行编码转换 (浏览器环境)
   * @param {string} text 
   * @param {string} sourceEncoding 
   * @param {string} targetEncoding 
   * @returns {string}
   */
  tryRecoveryWithTextEncoder(text, sourceEncoding, targetEncoding) {
    // 简化的编码转换逻辑
    // 处理常见的中文乱码情况
    
    if (sourceEncoding === 'gbk' && targetEncoding === 'utf-8') {
      return this.fixGbkToUtf8(text);
    }
    
    if (sourceEncoding === 'utf-8' && targetEncoding === 'gbk') {
      return this.fixUtf8ToGbk(text);
    }
    
    if (sourceEncoding === 'iso-8859-1' && targetEncoding === 'utf-8') {
      return this.fixLatin1ToUtf8(text);
    }

    // 对于其他编码，尝试一些常见的修复模式
    return this.applyCommonFixes(text);
  }

  /**
   * 修复 GBK 被误认为 UTF-8 的情况
   * @param {string} text 
   * @returns {string}
   */
  fixGbkToUtf8(text) {
    let fixed = text;
    
    // 使用配置文件中的替换映射
    const replacements = this.configManager.getCharReplacementMap('gbkToUtf8');
    
    for (const [garbled, correct] of Object.entries(replacements)) {
      fixed = fixed.replace(new RegExp(garbled, 'g'), correct);
    }

    return fixed;
  }

  /**
   * 修复 UTF-8 被误认为 GBK 的情况
   * @param {string} text 
   * @returns {string}
   */
  fixUtf8ToGbk(text) {
    // 这种情况通常会产生一些特殊字符
    return text.replace(/[^\u4e00-\u9fff\w\s\u3000-\u303f\uff00-\uffef]/g, '');
  }

  /**
   * 修复 Latin-1 被误认为 UTF-8 的情况
   * @param {string} text 
   * @returns {string}
   */
  fixLatin1ToUtf8(text) {
    let fixed = text;
    
    // 使用配置文件中的替换映射
    const replacements = this.configManager.getCharReplacementMap('latin1ToUtf8');
    
    for (const [garbled, correct] of Object.entries(replacements)) {
      fixed = fixed.replace(new RegExp(garbled, 'g'), correct);
    }

    return fixed;
  }

  /**
   * 应用常见的修复模式
   * @param {string} text 
   * @returns {string}
   */
  applyCommonFixes(text) {
    let fixed = text;

    // 移除明显的乱码字符
    fixed = fixed.replace(/�/g, ''); // 替换字符
    fixed = fixed.replace(/\uFFFD/g, ''); // Unicode 替换字符
    
    // 使用配置文件中的HTML实体替换
    const htmlReplacements = this.configManager.getCharReplacementMap('htmlEntities');
    for (const [entity, correct] of Object.entries(htmlReplacements)) {
      fixed = fixed.replace(new RegExp(entity, 'g'), correct);
    }

    // 标准化空白字符
    fixed = fixed.replace(/\s+/g, ' ').trim();

    return fixed;
  }

  /**
   * 检测是否在 Node.js 环境中运行
   * @returns {boolean}
   */
  isNodeEnvironment() {
    return typeof process !== 'undefined' && 
           process.versions && 
           process.versions.node;
  }
}

module.exports = GarbledTextRecovery;
