const { combinedFrequency, chineseFrequency, englishFrequency } = require('./frequency-dict');

/**
 * 文本可信度检测器
 * 基于字符频率统计来评估文本的可信度
 */
class TextCredibilityDetector {
  /**
   * 计算文本的可信度得分
   * @param {string} text - 要检测的文本
   * @returns {Object} 包含得分和详细信息的对象
   */
  static calculateCredibility(text) {
    if (!text || typeof text !== 'string') {
      return { score: 0, details: { error: 'Invalid input' } };
    }

    const stats = this.analyzeText(text);
    const frequencyScore = this.calculateFrequencyScore(text);
    const languageScore = this.detectLanguageConsistency(text);
    const structureScore = this.analyzeTextStructure(text);
    
    // 综合评分 (0-100)
    const totalScore = Math.min(100, Math.max(0, 
      frequencyScore * 0.4 + 
      languageScore * 0.3 + 
      structureScore * 0.3
    ));

    return {
      score: Math.round(totalScore * 100) / 100,
      details: {
        frequencyScore: Math.round(frequencyScore * 100) / 100,
        languageScore: Math.round(languageScore * 100) / 100,
        structureScore: Math.round(structureScore * 100) / 100,
        stats,
        language: this.detectPrimaryLanguage(text)
      }
    };
  }

  /**
   * 分析文本基本统计信息
   * @param {string} text 
   * @returns {Object} 统计信息
   */
  static analyzeText(text) {
    const length = text.length;
    const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
    const numberCount = (text.match(/[0-9]/g) || []).length;
    const punctuationCount = (text.match(/[，。、？！：；""''（）【】《》]/g) || []).length;
    const symbolCount = (text.match(/[^\u4e00-\u9fff\w\s，。、？！：；""''（）【】《》]/g) || []).length;

    return {
      length,
      chineseCount,
      englishCount,
      numberCount,
      punctuationCount,
      symbolCount,
      chineseRatio: length > 0 ? chineseCount / length : 0,
      englishRatio: length > 0 ? englishCount / length : 0
    };
  }

  /**
   * 基于字符频率计算得分
   * @param {string} text 
   * @returns {number} 频率得分 (0-100)
   */
  static calculateFrequencyScore(text) {
    if (!text) return 0;

    let totalScore = 0;
    let validCharCount = 0;
    // 低频中文统计
    let chineseTotal = 0;
  let lowFreqChinese = 0; // 频率 < 3
  let zeroFreqChinese = 0; // 频率 = 0

    for (const char of text) {
      if (combinedFrequency[char]) {
        totalScore += Math.log(combinedFrequency[char] + 1);
        validCharCount++;
      }
      // 统计中文低频/零频字（来自 chinese-frequency.json）
      if (/[\u4e00-\u9fff]/.test(char)) {
        chineseTotal++;
        const freq = chineseFrequency[char] || 0;
        if (freq === 0) {
          zeroFreqChinese++;
        } else if (freq < 3) {
          lowFreqChinese++;
        }
      }
    }

    if (validCharCount === 0) return 0;

    // 归一化得分
    const avgScore = totalScore / validCharCount;
    let score = Math.min(100, avgScore * 10);

    // 对中文低频字进行扣分：按比例扣，最多扣 10 分
    if (chineseTotal > 0 && lowFreqChinese > 0) {
      const ratio = lowFreqChinese / chineseTotal; // 0~1
      const penalty = Math.min(10, ratio * 10);
      score = Math.max(0, score - penalty);
    }

    // 对中文零频字进行额外扣分：按比例扣，最多扣 15 分
    if (chineseTotal > 0 && zeroFreqChinese > 0) {
      const ratio0 = zeroFreqChinese / chineseTotal; // 0~1
      const penalty0 = Math.min(15, ratio0 * 20);
      score = Math.max(0, score - penalty0);
    }

    return score;
  }

  /**
   * 检测语言一致性
   * @param {string} text 
   * @returns {number} 一致性得分 (0-100)
   */
  static detectLanguageConsistency(text) {
    const stats = this.analyzeText(text);
    
    // 如果文本太短，给予中等分数
    if (stats.length < 5) return 50;

    // 检查是否有明显的语言混乱（如过多的无意义字符组合）
    const invalidSequences = text.match(/[^\u4e00-\u9fff\w\s，。、？！：；""''（）【】《》]{3,}/g);
    if (invalidSequences && invalidSequences.length > 0) {
      return Math.max(0, 50 - invalidSequences.length * 10);
    }

    // 基于主要语言的一致性评分
    const primaryLang = this.detectPrimaryLanguage(text);
    if (primaryLang === 'chinese' && stats.chineseRatio > 0.3) return 85;
    if (primaryLang === 'english' && stats.englishRatio > 0.5) return 85;
    if (primaryLang === 'mixed' && (stats.chineseRatio + stats.englishRatio) > 0.4) return 70;

    return 40;
  }

  /**
   * 分析文本结构
   * @param {string} text 
   * @returns {number} 结构得分 (0-100)
   */
  static analyzeTextStructure(text) {
    if (!text) return 0;

    let score = 50; // 基础分

    // 检查标点符号使用是否合理
    const punctuationRatio = (text.match(/[，。、？！：；""''（）【】《》.,!?;:"'()[\]]/g) || []).length / text.length;
    if (punctuationRatio > 0.01 && punctuationRatio < 0.3) {
      score += 20;
    } else if (punctuationRatio > 0.5) {
      score -= 20;
    }

    // 检查连续重复字符
    const repeatedChars = text.match(/(.)\1{3,}/g);
    if (repeatedChars) {
      score -= repeatedChars.length * 10;
    }

    // 检查是否有明显的乱码模式
    const garbledPatterns = [
      /[^\u4e00-\u9fff\w\s，。、？！：；""''（）【】《》.,!?;:"'()[\]]{5,}/g,
      /�+/g, // 替换字符
      /\?{3,}/g // 连续问号
    ];

    for (const pattern of garbledPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score -= matches.length * 15;
      }
    }

    // 检查空白字符使用
    const spaceRatio = (text.match(/\s/g) || []).length / text.length;
    if (spaceRatio > 0.05 && spaceRatio < 0.5) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 检测文本的主要语言
   * @param {string} text 
   * @returns {string} 语言类型
   */
  static detectPrimaryLanguage(text) {
    const stats = this.analyzeText(text);
    
    if (stats.chineseRatio > 0.5) return 'chinese';
    if (stats.englishRatio > 0.7) return 'english';
    if (stats.chineseRatio > 0.2 && stats.englishRatio > 0.2) return 'mixed';
    
    return 'unknown';
  }
}

module.exports = TextCredibilityDetector;
