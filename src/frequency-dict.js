const fs = require('fs');
const path = require('path');

// 加载从CSV转换的中文字符频率数据
let chineseFrequencyFromCSV = {};
try {
  const jsonPath = path.join(__dirname, 'chinese-frequency.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  chineseFrequencyFromCSV = JSON.parse(jsonData);
  
  // 过滤掉非中文字符（数字等）
  const filteredChineseFrequency = {};
  Object.entries(chineseFrequencyFromCSV).forEach(([char, freq]) => {
    // 只保留中文字符、常用标点符号
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char) || 
        /[，。、？！：；""''（）【】《》]/.test(char)) {
      filteredChineseFrequency[char] = freq;
    }
  });
  
  chineseFrequencyFromCSV = filteredChineseFrequency;
} catch (error) {
  // 如果无法加载CSV数据，使用备用数据
  chineseFrequencyFromCSV = {
    '的': 4887, '一': 1406, '是': 1316, '不': 1071, '了': 952,
    '在': 926, '有': 908, '人': 782, '这': 762, '上': 603,
    '大': 584, '来': 578, '和': 577, '我': 576, '个': 572,
    '中': 546, '地': 538, '为': 535, '他': 492, '生': 491,
    '时': 483, '会': 441, '可': 431, '到': 425, '也': 413,
    '出': 410, '就': 406, '能': 401, '对': 392, '自': 382
  };
}

// 添加常用标点符号的频率（基于经验值）
const punctuationFrequency = {
  '。': 2000, '，': 1800, '、': 500, '？': 300, '！': 200,
  '：': 150, '；': 100, '"': 80, '"': 80, "'": 60, "'": 60,
  '（': 40, '）': 40, '【': 20, '】': 20, '《': 15, '》': 15
};

// 合并中文字符和标点符号频率
const chineseFrequency = {
  ...chineseFrequencyFromCSV,
  ...punctuationFrequency
};

// 英文字母频率（基于英文文本统计）
const englishFrequency = {
  'e': 1270, 't': 906, 'a': 817, 'o': 751, 'i': 697,
  'n': 675, 's': 633, 'h': 609, 'r': 599, 'd': 425,
  'l': 403, 'c': 278, 'u': 276, 'm': 241, 'w': 236,
  'f': 223, 'g': 202, 'y': 197, 'p': 193, 'b': 129,
  'v': 98, 'k': 77, 'j': 15, 'x': 15, 'q': 10, 'z': 7,
  'E': 127, 'T': 91, 'A': 82, 'O': 75, 'I': 70,
  'N': 68, 'S': 63, 'H': 61, 'R': 60, 'D': 43,
  'L': 40, 'C': 28, 'U': 28, 'M': 24, 'W': 24,
  'F': 22, 'G': 20, 'Y': 20, 'P': 19, 'B': 13,
  'V': 10, 'K': 8, 'J': 2, 'X': 2, 'Q': 1, 'Z': 1
};

// 数字频率
const numberFrequency = {
  '0': 100, '1': 120, '2': 110, '3': 105, '4': 100,
  '5': 98, '6': 96, '7': 94, '8': 92, '9': 90
};

// 合并所有频率字典
const combinedFrequency = {
  ...chineseFrequency,
  ...englishFrequency,
  ...numberFrequency
};

module.exports = {
  chineseFrequency,
  englishFrequency,
  numberFrequency,
  combinedFrequency
};
