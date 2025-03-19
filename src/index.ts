// 前端页面 (包含安全增强)
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' your-worker.example.com">
</head>
<body>
  <script>
    (async () => {
      const promptText = prompt("请输入图片描述（20-500字符）：");
      if (!promptText) return;

      try {
        // 添加请求校验
        const response = await fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ prompt: promptText.slice(0, 500) }) // 长度限制
        });

        // 处理错误状态
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '生成失败');
        }

        // 安全加载图片
        const blob = await response.blob();
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.onload = () => URL.revokeObjectURL(img.src); // 内存清理
        document.body.appendChild(img);

      } catch (error) {
        alert(\`错误：\${error.message}\`);
      }
    })();
  </script>
</body>
</html>
`;

// Worker 安全增强代码
export default {
  async fetch(request: Request, env: Env) {
    // 配置 CORS 头
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://your-worker.example.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
      "Access-Control-Max-Age": "86400"
    };

    // 处理预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 主请求处理
    try {
      // 请求过滤
      if (request.method === "POST") {
        // 校验 Content-Type
        const contentType = request.headers.get("Content-Type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Invalid content type");
        }

        // 获取并验证输入
        const { prompt } = await request.json();
        if (!prompt || typeof prompt !== "string") {
          throw new Error("Prompt required");
        }

        // 输入清洗
        const cleanPrompt = prompt
          .slice(0, 500)
          .replace(/[<>$]/g, ""); // 防止 XSS

        // 调用 AI 生成
        const response = await env.AI.run(
          "@cf/stabilityai/stable-diffusion-xl-base-1.0",
          { prompt: cleanPrompt }
        );

        // 返回安全响应
        return new Response(response, {
          headers: {
            "content-type": "image/png",
            ...corsHeaders,
            "X-Content-Type-Options": "nosniff",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
          }
        });
      }

      // 返回前端页面
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          ...corsHeaders,
          "X-Frame-Options": "DENY"
        }
      });

    } catch (error) {
      // 安全错误处理
      return new Response(JSON.stringify({
        error: true,
        message: error.message
      }), {
        status: 400,
        headers: {
          "content-type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
} satisfies ExportedHandler<Env>;
