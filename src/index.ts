// 前端 HTML 页面模板
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text to Image</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      background: var(--background);
    }

    .header {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .main-content {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }

    .generator-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      margin-top: 2rem;
    }

    .input-group {
      margin: 2rem 0;
    }

    .prompt-input {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .prompt-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .generate-btn {
      background: var(--primary);
      color: white;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .generate-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .loading-spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }

    .footer {
      background: rgba(255, 255, 255, 0.9);
      padding: 2rem;
      margin-top: auto;
      text-align: center;
      color: #6b7280;
    }

    .result-container {
      margin-top: 2rem;
      min-height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .generated-image {
      max-width: 100%;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s;
    }

    .generated-image:hover {
      transform: scale(1.02);
    }

    .error-message {
      color: #dc2626;
      background: #fee2e2;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .main-content {
        padding: 0 1rem;
      }
      .generator-card {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <nav class="nav-container">
      <a href="/" class="logo">Text to Image</a>
      <div>
        <a href="https://developers.cloudflare.com/workers-ai/" target="_blank" class="text-gray-600 hover:text-primary transition-colors">CloudFlare</a>
        <a href="https://github.com/evansrrr/cfworker-tti" target="_blank" class="ml-4 text-gray-600 hover:text-primary transition-colors">Github</a>
      </div>
    </nav>
  </header>

  <main class="main-content">
    <div class="generator-card">
      <h1 class="text-3xl font-bold text-gray-800 text-center">AI Image Generator</h1>
      <p class="text-gray-600 mt-2 text-center">Type the prompts below and click Generate to see the result.</p>

      <div class="input-group">
        <input 
          type="text" 
          id="promptInput"
          class="prompt-input"
          placeholder="e.g. Fuji Mountain, moonlight, blooms, comic style"
        >
      </div>

      <div class="text-center">
        <button onclick="generateImage()" class="generate-btn">
          <span>Generate</span>
        </button>
      </div>

      <div id="result" class="result-container"></div>
    </div>
  </main>

  <footer class="footer">
    <div class="max-w-4xl mx-auto">
      <p class="mb-2">Made with ❤️ by <a href="https://evansrrr.is-a.dev/" target="_blank">Raziore</a></p>
      <div class="text-sm text-gray-500">
        <!--<a href="#" class="hover:text-gray-700 transition-colors">服务条款</a>
        <span class="mx-2">|</span>
        <a href="#" class="hover:text-gray-700 transition-colors">隐私政策</a>
        <span class="mx-2">|</span>
        <a href="#" class="hover:text-gray-700 transition-colors">联系我们</a>-->
      </div>
    </div>
  </footer>

  <script>
    async function generateImage() {
      const promptInput = document.getElementById('promptInput');
      const resultDiv = document.getElementById('result');
      const btn = document.querySelector('.generate-btn');
      const originalBtnText = btn.innerHTML;

      // 校验输入
      if (!promptInput.value.trim()) {
        showError('Invalid input');
        return;
      }

      try {
        // 显示加载状态
        btn.innerHTML = \`
          <div class="loading-spinner"></div>
          <span>Processing...</span>
        \`;
        btn.disabled = true;

        // 发送请求
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptInput.value })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'An error accured.');
        }

        // 显示图片
        const blob = await response.blob();
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.className = 'generated-image';
        img.onload = () => URL.revokeObjectURL(img.src);

        resultDiv.innerHTML = '';
        resultDiv.appendChild(img);

      } catch (error) {
        showError(error.message);
      } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
      }
    }

    function showError(message) {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = \`
        <div class="error-message">
          <strong>Error: </strong>\${message}
        </div>
      \`;
    }
  </script>
</body>
</html>
`;

// Worker 处理代码保持不变（与之前相同）

export default {
  async fetch(request: Request, env: Env) {
    // 安全配置
    const CORS_HEADERS = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // 处理 OPTIONS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 处理 POST 请求（图片生成）
    if (request.method === "POST") {
      try {
        // 验证输入
        const { prompt } = await request.json();
        if (!prompt || typeof prompt !== 'string') {
          throw new Error("Invalid input");
        }

        // 输入清洗（防 XSS/长度限制）
        const cleanPrompt = prompt
          .slice(0, 500)
          .replace(/[<>$#]/g, "");

        // 调用 AI 模型
        const image = await env.AI.run(
          "@cf/stabilityai/stable-diffusion-xl-base-1.0",
          { prompt: cleanPrompt }
        );

        // 返回图片
        return new Response(image, {
          headers: {
            "Content-Type": "image/png",
            ...CORS_HEADERS,
            "Cache-Control": "public, max-age=3600" // 缓存 1 小时
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          error: true,
          message: error.message
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS
          }
        });
      }
    }

    // 返回前端页面（GET 请求）
    return new Response(HTML_PAGE, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        ...CORS_HEADERS
      }
    });
  }
} satisfies ExportedHandler<Env>;
