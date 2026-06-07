/**
 * Cloudflare Pages Functions - /api/tools
 * GET /api/tools  → 返回已审核通过的工具列表
 */
export async function onRequestGet(context) {
  const { env } = context;
  let tools = [];
  try {
    const raw = await env.AI_NAV_KV.get("tools");
    tools = raw ? JSON.parse(raw) : [];
  } catch (e) {
    return new Response(JSON.stringify({ error: "读取数据失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // 只返回已审核通过的
  const approved = tools.filter(t => t.status === "approved");

  return new Response(JSON.stringify(approved), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60"
    }
  });
}
