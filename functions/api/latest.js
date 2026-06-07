/**
 * Cloudflare Pages Functions - /api/latest
 * GET /api/latest → 返回最新收录的工具（基于真实时间）
 *
 * KV 存储结构：
 *   tools:all_meta → JSON数组 [{id, name, cat, logo, badge, addedAt}, ...]
 *   按 addedAt 降序返回最新 8 条
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取工具列表
    const toolsRaw = await env.AI_NAV_KV.get("tools");
    const allTools = toolsRaw ? JSON.parse(toolsRaw) : [];

    const approved = allTools
      .filter(t => t.status === "approved" || !t.status)
      .map(t => ({
        id: t.id,
        name: t.name,
        logo: t.logo || "🤖",
        cat: t.cat || "other",
        url: t.url || "#",
        badge: t.badge || "",
        desc: (t.desc || "").substring(0, 40),
        addedAt: t.addedAt || null,
      }));

    // 按 addedAt（审核通过时间）降序，没有时间的按 id 倒序
    approved.sort((a, b) => {
      if (a.addedAt && b.addedAt) return new Date(b.addedAt) - new Date(a.addedAt);
      if (a.addedAt) return -1;
      if (b.addedAt) return 1;
      return b.id - a.id;
    });

    const latest = approved.slice(0, 8);

    return new Response(JSON.stringify(latest), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=120"
      }
    });
  } catch (e) {
    console.error("Latest error:", e);
    return new Response(JSON.stringify({ error: "获取最新失败", data: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
