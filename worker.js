/**
 * Cloudflare Worker for Garbled Text Recovery
 * 为乱码文本恢复工具提供API服务（直接复用 src 中的实现）
 */

// 动态加载 src/index.js（CommonJS 导出由 Wrangler 打包处理）；避免冷启动时无谓加载
let __libPromise = null;
async function getLib() {
  if (!__libPromise) {
    // 使用动态导入以兼容 CommonJS/ESM；第二个分支适配无扩展的导入
    __libPromise = (async () => {
      let mod;
      try { mod = await import('./src/index.js'); } catch { mod = await import('./src/index'); }
      // CommonJS 会默认导出到 default
      // ESM 命名导出则直接在对象上
      return mod && mod.default ? mod.default : mod;
    })();
  }
  return __libPromise;
}

// 静态资源路径（通过 ASSETS 绑定提供，见 wrangler.toml）
const STATIC_PATHS = new Set(['/','/index.html','/worker.html','/styles.css','/app.js']);

// MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

/**
 * Worker主入口函数
 */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // API路由处理
      if (path.startsWith('/api/')) {
        return await handleAPI(request, path);
      }

      // 静态文件服务：交给 ASSETS 绑定处理；/ 重写到 /index.html
      if (STATIC_PATHS.has(path)) {
        // eslint-disable-next-line no-undef
        const assetReq = path === '/' ? new Request(new URL('/index.html', request.url), request) : request;
        // eslint-disable-next-line no-undef
        const res = await env.ASSETS.fetch(assetReq);
        if (res && res.status !== 404) return res;
        return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      // 404处理
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
};

/**
 * API路由处理
 */
async function handleAPI(request, path) {
  // CORS处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // 预检请求处理
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    switch (path) {
      case '/api/recover':
        return await handleRecover(request, corsHeaders);
      
      case '/api/quick':
        return await handleQuick(request, corsHeaders);

      case '/api/info':
        return await handleInfo(request, corsHeaders);
      
      case '/api/health':
        return await handleHealth(request, corsHeaders);
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'API endpoint not found'
        }), {
          status: 404,
          headers: corsHeaders
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'API processing error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * 处理文本恢复请求
 */
async function handleRecover(request, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    const { text, options = {} } = body;

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid input: text is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 参数验证和默认值
    const recoveryOptions = {
      maxResults: Math.min(Math.max(options.maxResults || 5, 1), 20),
      minCredibility: Math.min(Math.max(options.minCredibility || 30, 0), 100),
      strategy: ['fast', 'balanced', 'aggressive'].includes(options.strategy) ? options.strategy : 'balanced',
      category: ['chinese', 'western', 'japanese', 'korean'].includes(options.category) ? options.category : null,
      useRecommended: options.useRecommended !== false
    };

  // 执行恢复（复用 src/index.js 导出）
  const lib = await getLib();
  const startTime = Date.now();
  const results = lib.recoverFromGarbledText(text, recoveryOptions);
  const processingTime = Date.now() - startTime;

  // 收集信息
  const detectedEncodings = lib.detectPossibleEncodings(text);
  const recommendedPairs = lib.getRecommendedEncodingPairs(text, recoveryOptions);

    const response = {
      success: true,
      data: results,
      info: {
        processingTime,
        detectedEncodings,
        triedPairs: recommendedPairs.length,
        strategy: recoveryOptions.strategy,
        originalLength: text.length,
        resultsCount: results.length
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Recovery processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Recovery processing failed',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * 处理快速恢复请求（仅返回最佳结果）
 */
async function handleQuick(request, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    const { text, options = {} } = body || {};
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Invalid input: text is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const lib = await getLib();
    const best = lib.quickRecover(text, options);
    return new Response(JSON.stringify({ success: true, data: best }), { headers: corsHeaders });
  } catch (error) {
    console.error('Quick processing error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Quick processing failed', message: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * 处理系统信息请求
 */
async function handleInfo(request, corsHeaders) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const lib = await getLib();
    const encodings = lib.getSupportedEncodings();
    const strategies = lib.getAvailableStrategies();
    // 通过配置管理器读取分类（仅为列出类别）
    const ConfigMgr = lib.EncodingConfigManager;
    const cm = new ConfigMgr();
    const categories = Object.keys(cm.config.supportedEncodings || {});
    
    const response = {
      success: true,
      encodings,
      strategies,
      categories,
      version: '1.0.0',
      features: [
        'encoding-detection',
        'credibility-scoring', 
        'multi-strategy',
        'category-filtering',
        'batch-processing'
      ],
      limits: {
        maxTextLength: 10000,
        maxResults: 20,
        minCredibility: 0,
        maxCredibility: 100
      }
    };

    return new Response(JSON.stringify(response), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Info processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Info processing failed',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * 处理健康检查请求
 */
async function handleHealth(request, corsHeaders) {
  const response = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now(),
    version: '1.0.0'
  };

  return new Response(JSON.stringify(response), {
    headers: corsHeaders
  });
}

// 下面的日志/错误/限流工具保留以便未来扩展

/**
 * 请求日志中间件
 */
function logRequest(request) {
  const url = new URL(request.url);
  console.log(`${request.method} ${url.pathname} - ${request.headers.get('user-agent')}`);
}

/**
 * 错误处理中间件
 */
function handleError(error, request) {
  console.error('Request error:', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method
  });
}

/**
 * 速率限制中间件 (可选)
 */
async function rateLimit(request) {
  // 可以实现基于IP的速率限制
  // 使用CF KV或Durable Objects来存储请求计数
  return true; // 暂时总是允许
}
