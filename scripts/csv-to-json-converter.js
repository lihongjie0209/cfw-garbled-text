const fs = require('fs');
const path = require('path');

/**
 * CSV转换器
 * 将现代汉语汉字频率表CSV文件转换为JSON格式
 */
class CSVToJSONConverter {
  /**
   * 读取并解析CSV文件
   * @param {string} csvFilePath - CSV文件路径
   * @returns {Array} 解析后的数据数组
   */
  static parseCSV(csvFilePath) {
    try {
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // 解析表头
      const headers = this.parseCSVLine(lines[0]);
      console.log('CSV表头:', headers);
      
      // 解析数据行
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }
      
      console.log(`成功解析 ${data.length} 行数据`);
      return data;
    } catch (error) {
      console.error('解析CSV文件失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析CSV行（处理逗号分隔的值）
   * @param {string} line - CSV行
   * @returns {Array} 解析后的值数组
   */
  static parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // 添加最后一个值
    if (current) {
      values.push(current.trim());
    }
    
    return values;
  }

  /**
   * 将频率数据转换为字典格式
   * @param {Array} data - 解析后的CSV数据
   * @returns {Object} 字符频率字典
   */
  static convertToFrequencyDict(data) {
    const frequencyDict = {};
    
    data.forEach(row => {
      const char = row['汉字'];
      const frequency = parseFloat(row['频率（%）']);
      const count = parseInt(row['出现次数']);
      
      if (char && !isNaN(frequency)) {
        // 将百分比频率转换为相对分数（乘以1000以得到更好的分数范围）
        // 保留 0 值，不再将 0 强制改为 1，便于后续对零频进行惩罚
        const score = Math.round(frequency * 1000);
        frequencyDict[char] = score;
      }
    });
    
    console.log(`转换了 ${Object.keys(frequencyDict).length} 个字符的频率数据`);
    return frequencyDict;
  }

  /**
   * 生成频率统计报告
   * @param {Object} frequencyDict - 频率字典
   * @returns {Object} 统计报告
   */
  static generateReport(frequencyDict) {
    const frequencies = Object.values(frequencyDict);
    const characters = Object.keys(frequencyDict);
    
    // 排序获取最高频和最低频字符
    const sortedEntries = Object.entries(frequencyDict)
      .sort((a, b) => b[1] - a[1]);
    
    const report = {
      totalCharacters: characters.length,
      maxFrequency: Math.max(...frequencies),
      minFrequency: Math.min(...frequencies),
      avgFrequency: frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length,
      top10Characters: sortedEntries.slice(0, 10),
      bottom10Characters: sortedEntries.slice(-10).reverse(),
      frequencyRanges: {
        veryHigh: sortedEntries.filter(([, freq]) => freq >= 4000).length,
        high: sortedEntries.filter(([, freq]) => freq >= 1000 && freq < 4000).length,
        medium: sortedEntries.filter(([, freq]) => freq >= 100 && freq < 1000).length,
        low: sortedEntries.filter(([, freq]) => freq >= 10 && freq < 100).length,
        veryLow: sortedEntries.filter(([, freq]) => freq < 10).length
      }
    };
    
    return report;
  }

  /**
   * 主转换函数
   * @param {string} csvFilePath - CSV文件路径
   * @param {string} outputDir - 输出目录
   */
  static convert(csvFilePath, outputDir = './') {
    try {
      console.log('开始转换CSV文件:', csvFilePath);
      
      // 解析CSV
      const data = this.parseCSV(csvFilePath);
      
      // 转换为频率字典
      const frequencyDict = this.convertToFrequencyDict(data);
      
      // 生成报告
      const report = this.generateReport(frequencyDict);
      
      // 保存JSON文件
      const jsonPath = path.join(outputDir, 'chinese-frequency.json');
      fs.writeFileSync(jsonPath, JSON.stringify(frequencyDict, null, 2), 'utf-8');
      console.log('频率字典已保存到:', jsonPath);
      
      // 保存报告
      const reportPath = path.join(outputDir, 'frequency-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log('统计报告已保存到:', reportPath);
      
      // 打印报告摘要
      console.log('\n=== 转换完成 ===');
      console.log(`总字符数: ${report.totalCharacters}`);
      console.log(`最高频率: ${report.maxFrequency} (${report.top10Characters[0][0]})`);
      console.log(`最低频率: ${report.minFrequency}`);
      console.log(`平均频率: ${report.avgFrequency.toFixed(2)}`);
      
      console.log('\n前10个高频字符:');
      report.top10Characters.forEach(([char, freq], index) => {
        console.log(`${index + 1}. ${char}: ${freq}`);
      });
      
      console.log('\n频率分布:');
      console.log(`极高频 (>=4000): ${report.frequencyRanges.veryHigh} 个`);
      console.log(`高频 (1000-3999): ${report.frequencyRanges.high} 个`);
      console.log(`中频 (100-999): ${report.frequencyRanges.medium} 个`);
      console.log(`低频 (10-99): ${report.frequencyRanges.low} 个`);
      console.log(`极低频 (<10): ${report.frequencyRanges.veryLow} 个`);
      
      return {
        frequencyDict,
        report,
        jsonPath,
        reportPath
      };
      
    } catch (error) {
      console.error('转换失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const csvFilePath = path.join(__dirname, '..', 'src', '现代汉语汉字频率表.csv');
  const outputDir = path.join(__dirname, '..', 'src');
  
  try {
    CSVToJSONConverter.convert(csvFilePath, outputDir);
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

module.exports = CSVToJSONConverter;
