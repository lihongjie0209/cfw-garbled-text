# 乱码文本恢复库 (Garbled Text Recovery)

[![npm version](https://badge.fury.io/js/garbled-text-recovery.svg)](https://badge.fury.io/js/garbled-text-recovery)
[![Build Status](https://travis-ci.org/your-username/garbled-text-recovery.svg?branch=master)](https://travis-ci.org/your-username/garbled-text-recovery)
[![Coverage Status](https://coveralls.io/repos/github/your-username/garbled-text-recovery/badge.svg?branch=master)](https://coveralls.io/github/your-username/garbled-text-recovery?branch=master)

一个强大的JavaScript库，用于从乱码文本中恢复原始内容。通过智能编码检测和可信度评估，自动识别最可能的原始文本。

## 特性

- 🔍 **智能编码检测**: 自动尝试多种编码组合来恢复乱码文本
- 📊 **可信度评估**: 基于字符频率和语言模式评估恢复结果的可信度
- 🎯 **多语言支持**: 支持中文、英文及混合文本的恢复
- ⚡ **高性能**: 优化的算法确保快速处理
- 🛠️ **易于使用**: 简洁的API设计，支持批量处理
- 📝 **详细文档**: 完整的API文档和使用示例
- 🎛️ **可配置策略**: 支持快速、平衡、激进三种转换策略
- 📋 **编码分类**: 按语言类别（中文、西文、日文、韩文）智能过滤编码对
- 🔧 **JSON配置**: 编码映射和字符替换规则可通过配置文件自定义

## 安装

```bash
npm install garbled-text-recovery
```

## 快速开始

### 基本使用

```javascript
const { recoverFromGarbledText, detectTextCredibility } = require('garbled-text-recovery');

// 恢复乱码文本
const garbledText = 'ä¸­æ–‡ä¹±ç ';
const results = recoverFromGarbledText(garbledText);

console.log('恢复结果:');
results.forEach((result, index) => {
  console.log(`${index + 1}. "${result.recoveredText}"`);
  console.log(`   编码: ${result.sourceEncoding} -> ${result.targetEncoding}`);
  console.log(`   可信度: ${result.credibility.toFixed(2)}`);
});

// 检测文本可信度
const credibility = detectTextCredibility('这是正常的中文文本');
console.log(`文本可信度: ${credibility.score.toFixed(2)}`);
console.log(`主要语言: ${credibility.details.language}`);
```

### 快速恢复

```javascript
const { quickRecover } = require('garbled-text-recovery');

// 获取最佳恢复结果
const result = quickRecover('ä¸­æ–‡ä¹±ç ');
if (result) {
  console.log(`恢复结果: ${result.recoveredText}`);
  console.log(`可信度: ${result.credibility}`);
}

// 使用不同策略
const fastResult = quickRecover('ä¸­æ–‡ä¹±ç ', { strategy: 'fast' });
const balancedResult = quickRecover('ä¸­æ–‡ä¹±ç ', { strategy: 'balanced' });
const aggressiveResult = quickRecover('ä¸­æ–‡ä¹±ç ', { strategy: 'aggressive' });

// 按编码类别过滤
const chineseResult = quickRecover('ä¸­æ–‡ä¹±ç ', { 
  strategy: 'balanced',
  category: 'chinese' 
});
```

### 配置选项

```javascript
const options = {
  maxResults: 5,           // 最大返回结果数
  minCredibility: 40,      // 最小可信度阈值  
  strategy: 'balanced',    // 转换策略: 'fast' | 'balanced' | 'aggressive'
  category: 'chinese',     // 编码类别: 'chinese' | 'western' | 'japanese' | 'korean'
  useRecommended: true     // 使用智能推荐编码对
};

const results = recoverFromGarbledText(garbledText, options);
```

### 查询配置信息

```javascript
const { getSupportedEncodings, getAvailableStrategies, detectPossibleEncodings } = require('garbled-text-recovery');

// 获取支持的编码
console.log('所有编码:', getSupportedEncodings());
console.log('中文编码:', getSupportedEncodings('chinese'));

// 获取可用策略
console.log('可用策略:', getAvailableStrategies());

// 检测文本可能的编码类型
const possibleEncodings = detectPossibleEncodings(garbledText);
console.log('可能编码:', possibleEncodings);
```

const garbledText = 'ä¸­æ–‡ä¹±ç ';
const bestResult = quickRecover(garbledText);

if (bestResult) {
  console.log(`最佳恢复结果: "${bestResult.recoveredText}"`);
  console.log(`可信度: ${bestResult.credibility.toFixed(2)}`);
} else {
  console.log('无法恢复此文本');
}
```

### 批量处理

```javascript
const { batchRecover } = require('garbled-text-recovery');

const garbledTexts = [
  'ä¸­æ–‡ä¹±ç ',
  'æˆ'çˆ±ä¸­å›½',
  'Hello Worldï¼Œè¿™æ˜¯ä¸€ä¸ªæµ‹è¯•'
];

const results = batchRecover(garbledTexts);

results.forEach((result, index) => {
  console.log(`文本 ${index + 1}: "${result.originalText}"`);
  if (result.success && result.results.length > 0) {
    const best = result.results[0];
    console.log(`恢复为: "${best.recoveredText}"`);
    console.log(`可信度: ${best.credibility.toFixed(2)}`);
  } else {
    console.log('恢复失败');
  }
});
```

## API 文档

### recoverFromGarbledText(garbledText, options?)

从乱码文本中恢复原始内容。

#### 参数

- `garbledText` (string): 乱码文本
- `options` (object, 可选): 配置选项
  - `maxResults` (number): 最大返回结果数量 (默认: 10)
  - `minCredibility` (number): 最小可信度阈值 (默认: 30)
  - `commonEncodingsOnly` (boolean): 是否只使用常见编码 (默认: false)

#### 返回值

返回一个数组，包含恢复结果对象，按可信度降序排列。每个结果对象包含：

- `sourceEncoding` (string): 猜测的原编码
- `targetEncoding` (string): 目标编码  
- `recoveredText` (string): 恢复出来的文本
- `credibility` (number): 可信度得分 (0-100)
- `details` (object): 详细信息

#### 示例

```javascript
const results = recoverFromGarbledText('ä¸­æ–‡ä¹±ç ', {
  maxResults: 5,
  minCredibility: 50,
  commonEncodingsOnly: true
});
```

### detectTextCredibility(text)

检测文本的可信度。

#### 参数

- `text` (string): 要检测的文本

#### 返回值

返回包含可信度信息的对象：

- `score` (number): 可信度得分 (0-100)
- `details` (object): 详细信息
  - `frequencyScore` (number): 字符频率得分
  - `languageScore` (number): 语言一致性得分
  - `structureScore` (number): 文本结构得分
  - `stats` (object): 统计信息
  - `language` (string): 检测到的主要语言

#### 示例

```javascript
const credibility = detectTextCredibility('这是一段中文文本');
console.log(credibility.score); // 85.67
console.log(credibility.details.language); // 'chinese'
```

### quickRecover(garbledText)

快速恢复函数，只返回最佳结果。

#### 参数

- `garbledText` (string): 乱码文本

#### 返回值

返回最佳恢复结果对象，如果没有找到合适结果则返回 `null`。

#### 示例

```javascript
const result = quickRecover('ä¸­æ–‡ä¹±ç ');
if (result) {
  console.log(result.recoveredText);
}
```

### batchRecover(garbledTexts, options?)

批量处理多个乱码文本。

#### 参数

- `garbledTexts` (string[]): 乱码文本数组
- `options` (object, 可选): 配置选项（同 `recoverFromGarbledText`）

#### 返回值

返回处理结果数组，每个元素包含：

- `index` (number): 原数组中的索引
- `originalText` (string): 原始文本
- `results` (array): 恢复结果数组
- `success` (boolean): 是否成功
- `error` (string, 可选): 错误信息

#### 示例

```javascript
const results = batchRecover(['ä¸­æ–‡ä¹±ç ', 'æˆ'çˆ±ä¸­å›½']);
results.forEach(result => {
  if (result.success) {
    console.log(`成功恢复: ${result.results[0]?.recoveredText}`);
  }
});
```

## 支持的编码

库支持以下编码转换：

### 常用编码对
- GBK ↔ UTF-8
- Big5 ↔ UTF-8
- ISO-8859-1 → UTF-8
- Windows-1252 → UTF-8

### 完整编码列表
- GB2312 ↔ UTF-8
- Shift_JIS → UTF-8
- EUC-JP → UTF-8
- EUC-KR → UTF-8
- ISO-8859-2 → UTF-8
- ISO-8859-15 → UTF-8

## 可信度评估算法

可信度评估基于以下几个维度：

1. **字符频率分析** (40%权重)
   - 基于中文、英文字符使用频率
   - 常用字符获得更高分数

2. **语言一致性** (30%权重)
   - 检测语言混乱程度
   - 评估字符组合的合理性

3. **文本结构** (30%权重)
   - 标点符号使用是否合理
   - 是否存在明显的乱码模式
   - 空白字符分布

## 常见使用场景

### 网页爬虫数据清理

```javascript
const { batchRecover } = require('garbled-text-recovery');

// 从网页抓取的数据可能包含编码问题
const scrapedData = [
  'ä¸­å›½æ–°é—»',
  'ç§'æŠ€èµ„è®¯',
  // ... 更多数据
];

const cleanedData = batchRecover(scrapedData)
  .filter(result => result.success)
  .map(result => result.results[0]?.recoveredText)
  .filter(text => text);
```

### 文件编码修复

```javascript
const fs = require('fs');
const { recoverFromGarbledText } = require('garbled-text-recovery');

// 读取可能包含乱码的文件
const fileContent = fs.readFileSync('garbled-file.txt', 'utf8');
const results = recoverFromGarbledText(fileContent);

if (results.length > 0) {
  const recovered = results[0].recoveredText;
  fs.writeFileSync('recovered-file.txt', recovered, 'utf8');
  console.log('文件恢复完成');
}
```

### 数据库内容清理

```javascript
const { detectTextCredibility, quickRecover } = require('garbled-text-recovery');

async function cleanDatabaseRecords(records) {
  const cleanedRecords = [];
  
  for (const record of records) {
    const credibility = detectTextCredibility(record.content);
    
    if (credibility.score < 60) {
      // 可信度较低，尝试恢复
      const recovered = quickRecover(record.content);
      if (recovered && recovered.credibility > credibility.score) {
        record.content = recovered.recoveredText;
      }
    }
    
    cleanedRecords.push(record);
  }
  
  return cleanedRecords;
}
```

## 性能优化建议

1. **使用 `quickRecover`** 进行快速处理
2. **设置 `commonEncodingsOnly: true`** 来限制编码尝试
3. **调整 `minCredibility`** 阈值过滤低质量结果
4. **批量处理** 大量数据时使用 `batchRecover`

## 测试

```bash
# 运行所有测试
npm test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 开发

```bash
# 运行示例
npm run dev

# 查看示例输出
node src/example.js
```

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 此项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的乱码恢复功能
- 包含完整的可信度评估系统
- 提供批量处理功能

## 相关项目

- [iconv-lite](https://github.com/ashtuchkin/iconv-lite) - 字符编码转换库
- [charset-detector](https://github.com/ICU-TC/charset-detector-js) - 字符集检测库

## 支持

如果您觉得这个项目有用，请给它一个 ⭐️！

有问题？[提交 Issue](https://github.com/your-username/garbled-text-recovery/issues)
