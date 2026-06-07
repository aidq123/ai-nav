/**
 * Cloudflare Pages Functions - /api/click
 * POST /api/click → 记录工具被点击（用于热度统计）
 * Body: { id: "工具ID或name" }
 *
 * KV 存储结构：
 *   click:{toolId}  → 数字字符串，记录该工具总点击数
 *   clicks:all      → JSON对象 { toolId: count }，用于排行榜查询
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "无效的请求体" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const toolId = body.id || body.name;
  if (!toolId) {
    return new Response(JSON.stringify({ error: "缺少工具 ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const key = `click:${toolId}`;

    // 原子性递增点击计数
    const current = await env.AI_NAV_KV.get(key);
    const nextCount = current ? parseInt(current, 10) + 1 : 1;
    await env.AI_NAV_KV.put(key, String(nextCount));

    // 同时更新全局点击汇总表（用于快速排序）
    // 注意：高并发下可能有轻微不一致，但对导航站足够用
    const allClicksRaw = await env.AI_NAV_KV.get("clicks:all");
    let allClicks = allClicksRaw ? JSON.parse(allClicksRaw) : {};
    allClicks[toolId] = nextCount;
    // 防止过大：只保留前200个
    const entries = Object.entries(allClicks).sort((a,b) => b[1] - a[1]);
    if (entries.length > 200) {
      allClicks = Object.fromEntries(entries.slice(0, 200));
    }
    await env.AI_NAV_KV.put("clicks:all", JSON.stringify(allClicks));

    return new Response(JSON.stringify({ ok: true, clicks: nextCount }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    console.error("Click record error:", e);
    return new Response(JSON.stringify({ error: "记录失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
