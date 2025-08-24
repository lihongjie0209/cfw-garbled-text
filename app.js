// 乱码文本恢复工具 - 前端逻辑

class GarbledTextRecoveryApp {
    constructor() {
        this.apiEndpoint = '/api/recover';
        this.infoEndpoint = '/api/info';
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialData();
    }

    initializeElements() {
        // 输入元素
        this.garbledTextInput = document.getElementById('garbledText');
        this.strategySelect = document.getElementById('strategy');
        this.categorySelect = document.getElementById('category');
        this.maxResultsInput = document.getElementById('maxResults');
        this.minCredibilityInput = document.getElementById('minCredibility');

        // 按钮元素
        this.recoverBtn = document.getElementById('recoverBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.exampleBtn = document.getElementById('exampleBtn');

        // 显示区域
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.infoSection = document.getElementById('infoSection');
        this.infoContainer = document.getElementById('infoContainer');
        this.errorSection = document.getElementById('errorSection');
        this.errorContainer = document.getElementById('errorContainer');

        // 按钮文本元素
        this.btnText = this.recoverBtn.querySelector('.btn-text');
        this.btnLoading = this.recoverBtn.querySelector('.btn-loading');
    }

    attachEventListeners() {
        // 主要按钮事件
        this.recoverBtn.addEventListener('click', () => this.handleRecover());
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.exampleBtn.addEventListener('click', () => this.handleExample());

        // 示例点击事件
        document.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const exampleText = item.dataset.text;
                this.garbledTextInput.value = exampleText;
                this.hideAllSections();
            });
        });

        // 输入变化事件
        this.garbledTextInput.addEventListener('input', () => {
            this.hideAllSections();
        });

        // 回车键支持
        this.garbledTextInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.handleRecover();
            }
        });

        // API文档链接
        document.getElementById('apiDocsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showApiDocs();
        });
    }

    async loadInitialData() {
        try {
            const response = await fetch(this.infoEndpoint);
            const data = await response.json();
            
            if (data.success) {
                // 更新统计信息
                document.getElementById('supportedEncodings').textContent = data.encodings.length;
                document.getElementById('totalStrategies').textContent = data.strategies.length;
            }
        } catch (error) {
            console.warn('Failed to load initial data:', error);
        }
    }

    async handleRecover() {
        const garbledText = this.garbledTextInput.value.trim();
        
        if (!garbledText) {
            this.showError('请输入需要恢复的乱码文本');
            return;
        }

        this.setLoading(true);
        this.hideAllSections();

        try {
            const options = this.getRecoveryOptions();
            const response = await this.callRecoveryAPI(garbledText, options);

            if (response.success) {
                if (Array.isArray(response.data) && response.data.length > 0) {
                    this.displayResults(response.data);
                    this.displayInfo(response.info);
                } else {
                    // 无结果时，尝试快速模式作为回退
                    const quick = await this.callQuickAPI(garbledText, options);
                    if (quick.success && quick.data) {
                        this.displayResults([quick.data]);
                        this.displayInfo({
                            strategy: options.strategy,
                            triedPairs: response?.info?.triedPairs || 'N/A'
                        });
                        this.showHint('已使用“快速模式”返回最佳结果。可尝试降低“最小可信度”或更换策略。');
                    } else {
                        this.showError('未找到合适的恢复结果，请尝试降低“最小可信度”或切换策略后重试');
                    }
                }
            } else {
                this.showError(response.error || '恢复失败，请稍后重试');
            }
        } catch (error) {
            console.error('Recovery error:', error);
            this.showError('网络错误，请检查连接后重试');
        } finally {
            this.setLoading(false);
        }
    }

    async callRecoveryAPI(garbledText, options) {
        const requestBody = {
            text: garbledText,
            options: options
        };

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    async callQuickAPI(garbledText, options) {
        const response = await fetch(this.infoEndpoint.replace('/info', '/quick'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: garbledText, options })
        });
        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}` };
        }
        return await response.json();
    }

    getRecoveryOptions() {
        return {
            strategy: this.strategySelect.value,
            category: this.categorySelect.value || null,
            maxResults: parseInt(this.maxResultsInput.value),
            minCredibility: parseInt(this.minCredibilityInput.value),
            useRecommended: true
        };
    }

    displayResults(results) {
        if (!results || results.length === 0) {
            this.showError('未找到合适的恢复结果，请尝试调整参数');
            return;
        }

        this.resultsContainer.innerHTML = '';
        
        results.forEach((result, index) => {
            const resultElement = this.createResultElement(result, index + 1);
            this.resultsContainer.appendChild(resultElement);
        });

        this.resultsSection.style.display = 'block';
    }

    createResultElement(result, rank) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        // 根据可信度设置边框颜色
        const credibility = result.credibility;
        let borderColor = '#ef4444'; // red
        if (credibility >= 70) borderColor = '#10b981'; // green
        else if (credibility >= 50) borderColor = '#f59e0b'; // yellow
        
        resultDiv.style.borderLeftColor = borderColor;

        resultDiv.innerHTML = `
            <div class="result-header">
                <span class="result-rank">#${rank}</span>
                <div class="credibility-score">
                    <span>可信度: ${credibility.toFixed(1)}%</span>
                    <div class="credibility-bar">
                        <div class="credibility-fill" style="width: ${credibility}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="result-text" style="position: relative;">
                ${this.escapeHtml(result.recoveredText)}
                <button class="copy-btn" onclick="copyToClipboard('${this.escapeForJS(result.recoveredText)}')">
                    复制
                </button>
            </div>
            
            <div class="result-details">
                <div class="detail-item">
                    <div class="detail-label">源编码</div>
                    <div class="detail-value">${result.sourceEncoding}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">目标编码</div>
                    <div class="detail-value">${result.targetEncoding}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">转换描述</div>
                    <div class="detail-value">${result.description || '编码转换'}</div>
                </div>
                ${result.details && result.details.language ? `
                <div class="detail-item">
                    <div class="detail-label">检测语言</div>
                    <div class="detail-value">${this.getLanguageDisplay(result.details.language)}</div>
                </div>
                ` : ''}
            </div>
        `;

        return resultDiv;
    }

    displayInfo(info) {
        if (!info) return;

        let infoHtml = '';
        
        if (info.detectedEncodings) {
            infoHtml += `
                <div class="info-item">
                    <strong>检测到的编码类型:</strong> ${info.detectedEncodings.join(', ')}
                </div>
            `;
        }

        if (info.triedPairs) {
            infoHtml += `
                <div class="info-item">
                    <strong>尝试的编码对数量:</strong> ${info.triedPairs}
                </div>
            `;
        }

        if (info.strategy) {
            infoHtml += `
                <div class="info-item">
                    <strong>使用策略:</strong> ${this.getStrategyDisplay(info.strategy)}
                </div>
            `;
        }

        if (infoHtml) {
            this.infoContainer.innerHTML = infoHtml;
            this.infoSection.style.display = 'block';
        }
    }

    showError(message) {
        this.errorContainer.innerHTML = `
            <div class="error-message">
                <strong>错误:</strong> ${this.escapeHtml(message)}
            </div>
        `;
        this.errorSection.style.display = 'block';
    }

    showHint(message) {
        const hint = document.createElement('div');
        hint.className = 'error-message';
        hint.style.background = '#fef3c7';
        hint.style.borderColor = '#f59e0b';
        hint.style.color = '#92400e';
        hint.innerHTML = `<strong>提示:</strong> ${this.escapeHtml(message)}`;
        this.errorContainer.innerHTML = '';
        this.errorContainer.appendChild(hint);
        this.errorSection.style.display = 'block';
    }

    handleClear() {
        this.garbledTextInput.value = '';
        this.strategySelect.value = 'balanced';
        this.categorySelect.value = '';
        this.maxResultsInput.value = '5';
        this.minCredibilityInput.value = '30';
        this.hideAllSections();
        this.garbledTextInput.focus();
    }

    handleExample() {
        const examples = [
            'ä¸­æ–‡ä¹±ç ',
            'HÃ¤llo WÃ¶rld',
            'IO Error: Áíһ¸ö³ÌÐòÕýÔÚʹÓôËÎļþ',
            'ÎļþδÕÒµ½',
            '·ÃÎÊ±»¾Ü¾ø'
        ];
        
        const randomExample = examples[Math.floor(Math.random() * examples.length)];
        this.garbledTextInput.value = randomExample;
        this.hideAllSections();
    }

    setLoading(loading) {
        this.recoverBtn.disabled = loading;
        if (loading) {
            this.btnText.style.display = 'none';
            this.btnLoading.style.display = 'inline';
        } else {
            this.btnText.style.display = 'inline';
            this.btnLoading.style.display = 'none';
        }
    }

    hideAllSections() {
        this.resultsSection.style.display = 'none';
        this.infoSection.style.display = 'none';
        this.errorSection.style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeForJS(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }

    getLanguageDisplay(language) {
        const languageMap = {
            'chinese': '中文',
            'english': '英文',
            'mixed': '混合语言',
            'unknown': '未知'
        };
        return languageMap[language] || language;
    }

    getStrategyDisplay(strategy) {
        const strategyMap = {
            'fast': '快速模式',
            'balanced': '平衡模式',
            'aggressive': '激进模式'
        };
        return strategyMap[strategy] || strategy;
    }

    showApiDocs() {
        const apiInfo = `
API 端点:

POST /api/recover
- 恢复乱码文本
- 请求体: { "text": "乱码文本", "options": {...} }
- 响应: { "success": true, "data": [...], "info": {...} }

GET /api/info  
- 获取系统信息
- 响应: { "success": true, "encodings": [...], "strategies": [...] }

选项参数:
- strategy: "fast" | "balanced" | "aggressive"
- category: "chinese" | "western" | "japanese" | "korean" | null
- maxResults: 1-20
- minCredibility: 0-100
- useRecommended: boolean
        `;
        
        alert(apiInfo);
    }
}

// 全局函数
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // 可以添加成功提示
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '已复制!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#3b82f6';
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GarbledTextRecoveryApp();
});

// 添加一些键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'k': // Ctrl+K 清空
                e.preventDefault();
                document.getElementById('clearBtn').click();
                break;
            case 'Enter': // Ctrl+Enter 恢复
                e.preventDefault();
                document.getElementById('recoverBtn').click();
                break;
        }
    }
});

// 添加错误处理
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Service Worker 注册 (可选)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered: ', registration);
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
