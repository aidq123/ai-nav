/**
 * Cloudflare Pages Functions - 全局中间件
 * 处理 CORS 预检请求（OPTIONS）
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Admin-Token",
      "Access-Control-Max-Age": "86400"
    }
  });
}

/**
 * 为所有响应自动添加 CORS 头
 * onRequest 会对每个请求执行（GET/POST/PUT/DELETE 等）
 */
export async function onRequest(context) {
  // 先执行对应 HTTP 方法的 handler
  const response = await context.next();
  const newResponse = new Response(response.body, response);

  newResponse.headers.set("Access-Control-Allow-Origin", "*");
  newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Admin-Token");

  return newResponse;
}
