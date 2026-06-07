/**
 * Cloudflare Pages Functions - /api/admin/tools
 * GET    /api/admin/tools        → 列出所有工具（含 pending）
 * PUT    /api/admin/tools?id=xxx&action=approve|reject  → 审核操作
 * DELETE /api/admin/tools?id=xxx  → 删除工具
 *
 * ⚠️ 简易鉴权：在请求头带入 Admin-Token，与 KV 中 admin_token 比对
 *    首次使用请在 KV 中手动写入 key=admin_token, value=你的密码
 */
import { verifyAuth } from "../_middleware.js";

async function checkAuth(request, env) {
  const token = request.headers.get("Admin-Token") || "";
  const stored = await env.AI_NAV_KV.get("admin_token");
  if (!stored) {
    // 首次使用自动初始化 token = "aidq123admin"（请立即修改！）
    await env.AI_NAV_KV.put("admin_token", "aidq123admin");
    return token === "aidq123admin";
  }
  return token === stored;
}

// ===== GET：列出所有工具 =====
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!await checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: "未授权，请提供 Admin-Token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let tools = [];
  try {
    const raw = await env.AI_NAV_KV.get("tools");
    tools = raw ? JSON.parse(raw) : [];
  } catch { tools = []; }

  return new Response(JSON.stringify(tools), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

// ===== PUT：审核操作 =====
export async function onRequestPut(context) {
  const { request, env } = context;
  if (!await checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: "未授权" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action"); // approve | reject

  if (!id || !action) {
    return new Response(JSON.stringify({ error: "缺少 id 或 action 参数" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let tools = [];
  try {
    const raw = await env.AI_NAV_KV.get("tools");
    tools = raw ? JSON.parse(raw) : [];
  } catch { tools = []; }

  const idx = tools.findIndex(t => t.id === id);
  if (idx === -1) {
    return new Response(JSON.stringify({ error: "工具不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  tools[idx].status = action === "approve" ? "approved" : "rejected";
  tools[idx].reviewedAt = new Date().toISOString();
  if (action === "approve") {
    tools[idx].addedAt = new Date().toISOString(); // 记录审核通过时间（用于最新收录排序）
  }

  await env.AI_NAV_KV.put("tools", JSON.stringify(tools));

  return new Response(JSON.stringify({ ok: true, status: tools[idx].status }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// ===== DELETE：删除工具 =====
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!await checkAuth(request, env)) {
    return new Response(JSON.stringify({ error: "未授权" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "缺少 id 参数" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  let tools = [];
  try {
    const raw = await env.AI_NAV_KV.get("tools");
    tools = raw ? JSON.parse(raw) : [];
  } catch { tools = []; }

  const filtered = tools.filter(t => t.id !== id);
  if (filtered.length === tools.length) {
    return new Response(JSON.stringify({ error: "工具不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  await env.AI_NAV_KV.put("tools", JSON.stringify(filtered));

  return new Response(JSON.stringify({ ok: true, deleted: tools.length - filtered.length }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// CORS 预检
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Admin-Token"
    }
  });
}
