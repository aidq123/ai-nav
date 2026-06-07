/**
 * Cloudflare Pages Functions - /api/submit
 * POST /api/submit → 提交新工具（进入待审核）
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "请求体 JSON 格式错误" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const { name, url, desc, cat, pricing, tags, email, relation, authorNote } = body;

  // 基础校验
  if (!name || !url || !desc || !cat) {
    return new Response(JSON.stringify({ error: "名称、网址、简介、分类为必填项" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // 生成 ID
  const id = Date.now().toString(36).toUpperCase()
    + Math.random().toString(36).slice(2, 5).toUpperCase();

  const record = {
    id,
    name: String(name).trim(),
    url: String(url).trim(),
    desc: String(desc).trim(),
    cat: String(cat).trim(),
    pricing: pricing || "免费",
    tags: Array.isArray(tags) ? tags : [],
    email: (email || "").trim(),
    relation: relation || "用户",
    authorNote: (authorNote || "").trim(),
    status: "pending",
    createdAt: new Date().toISOString()
  };

  // 读取现有数据
  let tools = [];
  try {
    const raw = await env.AI_NAV_KV.get("tools");
    tools = raw ? JSON.parse(raw) : [];
  } catch {
    tools = [];
  }

  tools.unshift(record);
  await env.AI_NAV_KV.put("tools", JSON.stringify(tools));

  return new Response(JSON.stringify({ ok: true, id, message: "提交成功，等待审核" }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
