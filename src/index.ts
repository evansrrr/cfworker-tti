// 前端 HTML 页面模板
const HTML_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <title>AI 图像生成</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .container { text-align: center; }
    input { width: 80%; padding: 12px; margin: 1rem 0; }
    button { background: #0070f3; color: white; border: none; padding: 12px 24px; cursor: pointer; }
    img { max-width: 100%; margin-top: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <h1>自定义图像生成</h1>
    <input type="text" id="promptInput" placeholder="输入图片描述 (例如：一只穿着宇航服的猫)">
    <button onclick="generateImage()">生成图片</button>
    <div id="result"></div>
  </div>

  <script>
    async function generateImage() {
      const prompt = document.getElementById('promptInput').value;
      const resultDiv = document.getElementById('result');
      
      if (!prompt) {
        alert("请输入图片描述");
        return;
      }

      try {
        resultDiv.innerHTML = '<div class="loading">生成中...</div>';
        
        // 发送生成请求
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        // 显示生成的图片
        const blob = await response.blob();
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.onload = () => URL.revokeObjectURL(img.src); // 释放内存
        
        resultDiv.innerHTML = '';
        resultDiv.appendChild(img);

      } catch (error) {
        resultDiv.innerHTML = \`<div class="error">错误：\${error.message}</div>\`;
      }
    }
  </script>
</body>
</html>
`;

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
          throw new Error("无效的输入参数");
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
