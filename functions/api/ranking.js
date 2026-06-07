/**
 * Cloudflare Pages Functions - /api/ranking
 * GET /api/ranking → 返回热度排行榜（基于真实点击数据）
 *
 * 排序逻辑：
 *   1. 有 KV 点击数据的 → 按点击数降序
 *   2. 无点击数据的 → 按 badge 权重（hot > featured > new > 无）+ id 补充
 *   返回前 10 条，包含 name, clicks, badge, cat, logo
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取工具列表
    const toolsRaw = await env.AI_NAV_KV.get("tools");
    const allTools = toolsRaw ? JSON.parse(toolsRaw) : [];

    // 获取点击汇总表
    const clicksRaw = await env.AI_NAV_KV.get("clicks:all");
    const clickMap = clicksRaw ? JSON.parse(clicksRaw) : {};

    // 合并数据并排序
    const ranked = allTools
      .filter(t => t.status === "approved" || !t.status)
      .map(t => ({
        id: t.id,
        name: t.name,
        logo: t.logo || "🤖",
        cat: t.cat || "other",
        url: t.url || "#",
        badge: t.badge || "",
        clicks: clickMap[t.id] || clickMap[t.name] || 0,
      }))
      // 按点击数降序；点击相同时按 badge 权重排序
      .sort((a, b) => {
        if (b.clicks !== a.clicks) return b.clicks - a.clicks;
        const weight = { hot: 3, featured: 2, new: 1 };
        return (weight[b.badge]||0) - (weight[a.badge]||0) || (a.id - b.id);
      })
      .slice(0, 10);

    return new Response(JSON.stringify(ranked), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=120"
      }
    });
  } catch (e) {
    console.error("Ranking error:", e);
    return new Response(JSON.stringify({ error: "获取排行失败", data: [] }), {
      status: 200, // 即使出错也返回空数组让前端能降级
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
