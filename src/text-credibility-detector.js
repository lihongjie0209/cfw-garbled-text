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
    if (typeof text !== 'string') {
      return { score: 0, details: { error: 'Invalid input', language: 'unknown', stats: this.analyzeText(''), frequencyScore: 0, languageScore: 0, structureScore: 0 } };
    }
    if (text.length === 0) {
      return { score: 0, details: { error: 'empty', language: 'unknown', stats: this.analyzeText(text), frequencyScore: 0, languageScore: 0, structureScore: 0 } };
    }

    const stats = this.analyzeText(text);
    const frequencyScore = this.calculateFrequencyScore(text);
    const languageScore = this.detectLanguageConsistency(text);
    const structureScore = this.analyzeTextStructure(text);
    
    // 综合评分 (0-100)
    let totalScore = Math.min(100, Math.max(0,
      frequencyScore * 0.45 +
      languageScore * 0.3 +
      structureScore * 0.25
    ));

    // 对主要由字母组成但非典型中文/英文的文本，避免分数过低（如含重音的拉丁字母）
    try {
      const letterCount = (text.match(/\p{L}/gu) || []).length;
      const letterRatio = text.length > 0 ? letterCount / text.length : 0;
      if (letterRatio > 0.8 && totalScore < 10) {
        totalScore = 10;
      }
    } catch (_) {
      // 忽略环境不支持 Unicode 属性转义的情况
    }

    // 对完全由符号类字符组成的文本进行上限压制，避免过高评分
    const symStats = stats || this.analyzeText(text);
    if (symStats.length > 0) {
      const symbolRatio = symStats.symbolCount / symStats.length;
      if (symStats.chineseCount === 0 && symStats.englishCount === 0 && symbolRatio > 0.2) {
        totalScore = Math.min(totalScore, 25);
      }
    }

    // 对单一字符长串（如 aaaaaaaaaaaaaaaa）进行上限压制
    if (/^(.)\1{7,}$/.test(text)) {
      totalScore = Math.min(totalScore, 30);
    }

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
  const punctuationCount = (text.match(/[，。、？！：；""''（）【】《》.,!?;:\"'()[\]]/g) || []).length;
  const symbolCount = (text.match(/[^\u4e00-\u9fff\w\s，。、？！：；""''（）【】《》.,!?;:\"'()[\]]/g) || []).length;

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
  // 稍微提高缩放以提升正常文本得分
  let score = Math.min(100, avgScore * 14);

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

    // 对超长的重复字符序列进行额外扣分
    const longRepeats = text.match(/(.)\1{5,}/g);
    if (longRepeats && longRepeats.length > 0) {
      score = Math.max(0, score - Math.min(30, longRepeats.reduce((p, m) => p + (m.length - 5) * 2, 0)));
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
    const invalidSequences = text.match(/[^\u4e00-\u9fff\w\s，。、？！：；""''（）【】《》.,!?;:\"'()[\]]{3,}/g);
    if (invalidSequences && invalidSequences.length > 0) {
      return Math.max(0, 40 - invalidSequences.length * 20);
    }

    // 连续单一字符（如 aaaaaaa）视为低一致性
    if (/^(.)\1{5,}$/.test(text)) {
      return 10;
    }

    // 基于主要语言的一致性评分
    const primaryLang = this.detectPrimaryLanguage(text);
  if (primaryLang === 'chinese' && stats.chineseRatio > 0.3) return 92;
  if (primaryLang === 'english' && stats.englishRatio > 0.5) return 90;
  if (primaryLang === 'mixed' && (stats.chineseRatio + stats.englishRatio) > 0.4) return 80;

    return 40;
  }

  /**
   * 分析文本结构
   * @param {string} text 
   * @returns {number} 结构得分 (0-100)
   */
  static analyzeTextStructure(text) {
    if (!text) return 0;

  let score = 55; // 基础分适当提高
  const stats = this.analyzeText(text);

    // 检查标点符号使用是否合理
    const punctuationRatio = (text.match(/[，。、？！：；""''（）【】《》.,!?;:\"'()[\]]/g) || []).length / text.length;
    if (punctuationRatio > 0.01 && punctuationRatio < 0.3) {
      score += 30;
    } else if (punctuationRatio > 0.5) {
      score -= 25;
    }

    // 检查连续重复字符
    const repeatedChars = text.match(/(.)\1{3,}/g);
    if (repeatedChars) {
      const repeatPenalty = repeatedChars.reduce((p, m) => p + Math.min(50, (m.length - 3) * 6), 0);
      score -= repeatPenalty;
    }

    // 检查是否有明显的乱码模式
    const garbledPatterns = [
      /[^\u4e00-\u9fff\w\s，。、？！：；""''（）【】《》.,!?;:\"'()[\]]{5,}/g,
      /�+/g, // 替换字符
      /\?{3,}/g // 连续问号
    ];

    for (const pattern of garbledPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        score -= matches.length * 25;
      }
    }

    // 检查空白字符使用
    const spaceRatio = (text.match(/\s/g) || []).length / text.length;
    if (spaceRatio > 0.05 && spaceRatio < 0.5) {
      score += 10;
    }

    // 对符号类字符占比较高的文本进行扣分（如 @#$%^ 等）
    if (stats.length > 0) {
      const symbolRatio = stats.symbolCount / stats.length;
      if (symbolRatio > 0.2) {
        score -= Math.min(60, Math.round(symbolRatio * 120));
      }
      // 如果既没有中文也没有英文，结构可信度降低
      if (stats.chineseCount === 0 && stats.englishCount === 0) {
        score -= 20;
      }
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
  // 优先识别混合文本：两种语言均占一定比例
  if (stats.chineseRatio > 0.08 && stats.englishRatio > 0.08) return 'mixed';
  // 然后再判断单一主语言
  if (stats.chineseRatio > 0.4) return 'chinese';
  if (stats.englishRatio > 0.8) return 'english';

  return 'unknown';
  }
}

module.exports = TextCredibilityDetector;
