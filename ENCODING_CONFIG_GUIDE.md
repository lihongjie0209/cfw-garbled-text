# 编码配置系统使用指南

## 概述

新的编码配置系统将编码映射和转换策略提取为JSON配置文件，使代码更加模块化和可配置。

## 配置文件结构

### `src/encoding-config.json`

包含以下主要部分：

1. **supportedEncodings**: 按语言类别分组的支持编码
2. **commonPairs**: 常用编码对映射
3. **extendedPairs**: 扩展编码对映射
4. **charReplacementMaps**: 字符替换映射表
5. **autoDetectionRules**: 自动检测规则
6. **conversionStrategies**: 转换策略配置

## 主要改进

### 1. 可配置的转换策略

```javascript
const recovery = require('garbled-text-recovery');

// 快速策略 - 只使用最常见编码对
const result = recovery.quickRecover(garbledText, { strategy: 'fast' });

// 平衡策略 - 速度和准确性平衡
const result = recovery.quickRecover(garbledText, { strategy: 'balanced' });

// 激进策略 - 尝试所有可能编码组合
const result = recovery.quickRecover(garbledText, { strategy: 'aggressive' });
```

### 2. 编码类别过滤

```javascript
// 只尝试中文编码
const result = recovery.quickRecover(garbledText, { 
  strategy: 'balanced',
  category: 'chinese' 
});

// 只尝试西文编码  
const result = recovery.quickRecover(garbledText, {
  strategy: 'balanced', 
  category: 'western'
});
```

### 3. 智能推荐编码对

```javascript
// 根据文本内容自动推荐最可能的编码对
const recommendedPairs = recovery.getRecommendedEncodingPairs(garbledText);
console.log(recommendedPairs);

// 使用推荐编码对进行恢复
const result = recovery.quickRecover(garbledText, { useRecommended: true });
```

### 4. 查询配置信息

```javascript
// 获取所有支持的编码
const allEncodings = recovery.getSupportedEncodings();
console.log('所有编码:', allEncodings);

// 获取特定类别的编码
const chineseEncodings = recovery.getSupportedEncodings('chinese');
console.log('中文编码:', chineseEncodings);

// 获取可用策略
const strategies = recovery.getAvailableStrategies();
console.log('可用策略:', strategies);

// 检测文本可能的编码类型
const possibleEncodings = recovery.detectPossibleEncodings(garbledText);
console.log('可能编码:', possibleEncodings);
```

## 配置详解

### 转换策略

| 策略名称 | 描述 | 最大尝试次数 | 包含扩展编码 | 适用场景 |
|---------|------|------------|-------------|----------|
| fast | 快速模式 | 6 | 否 | 性能优先，常见乱码 |
| balanced | 平衡模式 | 20 | 是 | 速度与准确性平衡 |
| aggressive | 激进模式 | 50 | 是 | 准确性优先，复杂乱码 |

### 编码类别

| 类别 | 包含编码 | 适用语言 |
|-----|---------|----------|
| chinese | utf-8, gbk, gb2312, big5 | 中文 |
| western | utf-8, iso-8859-1, windows-1252, iso-8859-2, iso-8859-15 | 英文、欧洲语言 |
| japanese | utf-8, shift_jis, euc-jp | 日文 |
| korean | utf-8, euc-kr | 韩文 |

### 字符替换映射

配置文件包含预定义的字符替换映射：

- **gbkToUtf8**: GBK→UTF-8常见乱码修复
- **latin1ToUtf8**: Latin-1→UTF-8常见乱码修复  
- **htmlEntities**: HTML实体字符修复

## 使用示例

### 基础使用

```javascript
const recovery = require('garbled-text-recovery');

// 使用默认配置
const result = recovery.quickRecover('ä¸­æ–‡ä¹±ç ');

// 指定策略
const result = recovery.quickRecover('ä¸­æ–‡ä¹±ç ', { strategy: 'fast' });

// 指定类别
const result = recovery.quickRecover('ä¸­æ–‡ä¹±ç ', { 
  strategy: 'balanced',
  category: 'chinese' 
});
```

### 高级配置

```javascript
// 完整配置示例
const options = {
  maxResults: 5,           // 最大返回结果数
  minCredibility: 40,      // 最小可信度阈值
  strategy: 'balanced',    // 转换策略
  category: 'chinese',     // 编码类别过滤
  useRecommended: true     // 使用智能推荐
};

const results = recovery.recoverFromGarbledText(garbledText, options);
```

### 批量处理

```javascript
const garbledTexts = [
  'ä¸­æ–‡ä¹±ç ',
  'HÃ¤llo WÃ¶rld',
  'IO Error: Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ'
];

const results = recovery.batchRecover(garbledTexts, { 
  strategy: 'fast',
  category: 'chinese' 
});

results.forEach(result => {
  if (result.success) {
    console.log(`恢复成功: ${result.result.recoveredText}`);
  } else {
    console.log(`恢复失败: ${result.originalText}`);
  }
});
```

## 向后兼容性

新系统完全向后兼容，旧的API调用方式仍然有效：

```javascript
// 旧方式 - 仍然有效
const result = recovery.quickRecover(garbledText);
const results = recovery.recoverFromGarbledText(garbledText, { 
  commonEncodingsOnly: true 
});

// 新方式 - 推荐使用
const result = recovery.quickRecover(garbledText, { strategy: 'fast' });
const results = recovery.recoverFromGarbledText(garbledText, { 
  strategy: 'fast' 
});
```

## 扩展配置

### 添加新编码对

在 `encoding-config.json` 中添加：

```json
{
  "sourceEncoding": "新编码1",
  "targetEncoding": "新编码2", 
  "description": "描述",
  "priority": 7,
  "category": "类别"
}
```

### 添加字符替换映射

```json
{
  "charReplacementMaps": {
    "newMapping": {
      "乱码字符": "正确字符",
      "另一个乱码": "另一个正确字符"
    }
  }
}
```

### 自定义检测规则

```json
{
  "autoDetectionRules": {
    "newLanguageIndicators": [
      "特征字符1", 
      "特征字符2"
    ]
  }
}
```

## 性能优化建议

1. **选择合适策略**: 
   - 常见乱码用 `fast`
   - 复杂乱码用 `aggressive`
   - 日常使用推荐 `balanced`

2. **使用类别过滤**:
   - 明确语言类型时指定 `category`
   - 可显著减少尝试次数

3. **启用智能推荐**:
   - 设置 `useRecommended: true`
   - 根据文本特征优化编码对选择

4. **调整阈值**:
   - 提高 `minCredibility` 过滤低质量结果
   - 降低 `maxResults` 减少处理时间

这个新的配置系统使乱码恢复工具更加灵活、可配置和易于扩展，同时保持了良好的性能和准确性。
