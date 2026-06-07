/**
 * app.js - AI大全站主逻辑（远程数据版）
 * 数据源优先级：GitHub stats.json → 本地硬编码兜底
 * 加载顺序：tools-data.js → app.js（本文件）
 */
const categories = {
  chat:  { label:'AI对话',  icon:'💬' },
  image:  { label:'AI绘图',  icon:'🎨' },
  video:  { label:'AI视频',  icon:'🎬' },
  code:   { label:'AI编程',  icon:'💻' },
  write:  { label:'AI写作',  icon:'✍️' },
  audio:  { label:'AI音频',  icon:'🎵' },
  search: { label:'AI搜索',  icon:'🔍' },
  ppt:    { label:'AI办公',  icon:'📊' },
  design: { label:'AI设计',  icon:'🖌️' },
  translate:{ label:'AI翻译',  icon:'🌐' },
  edu:    { label:'AI学习',  icon:'📚' },
  agent:  { label:'AI智能体',icon:'🤖' },
  '3d':   { label:'AI 3D',   icon:'🧊' },
  'image-proc':{ label:'AI图像处理',icon:'🖼️' },
  mind:    { label:'AI思维导图', icon:'🧠' },
  resume:  { label:'AI简历',   icon:'📄' },
  data:    { label:'AI数据分析', icon:'📈' },
  other:   { label:'其他',     icon:'⚡' }
};

let tools = [];
let currentCat = 'all';
let searchQuery = '';

// ===== 远程数据源 =====
const STATS_URL = 'https://raw.githubusercontent.com/aidq123/ai-nav/master/data/stats.json';
// 备用 CDN 链接（GitHub 被墙时自动切换）
const STATS_URL_BACKUP = 'https://cdn.jsdelivr.net/gh/aidq123/ai-nav@master/data/stats.json';

/** 远程加载的统计数据 */
let remoteStats = null;  // { clicks: {}, addedAt: {}, totalClicks: N, lastUpdated: '' }

/** 从远程 JSON 加载统计数据 */
async function loadRemoteStats() {
  for (const url of [STATS_URL, STATS_URL_BACKUP]) {
    try {
      const resp = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.clicks && data.addedAt) {
          remoteStats = data;
          console.log(`[数据] 远程统计已加载（总点击 ${data.totalClicks || '-'}，更新于 ${data.lastUpdated || '-'}）`);
          return true;
        }
      }
    } catch (e) {
      console.warn(`[数据] ${url} 加载失败：${e.message}`);
    }
  }
  console.warn('[数据] 远程数据不可用，使用本地缓存');
  return false;
}

/** 获取工具热度值：远程优先 → 本地 HEAT_DATA 兜底 */
function getToolHeat(toolId) {
  if (remoteStats && remoteStats.clicks && remoteStats.clicks[toolId]) {
    return remoteStats.clicks[toolId];
  }
  return HEAT_DATA[toolId] || 0;
}

/** 获取工具收录日期：远程优先 → 本地 LATEST_DATES 兜底 */
function getToolAddedAt(toolId) {
  if (remoteStats && remoteStats.addedAt && remoteStats.addedAt[toolId]) {
    return remoteStats.addedAt[toolId];
  }
  return LATEST_DATES[toolId];
}

// ===== 加载工具数据 =====
async function loadTools() {
  // 先尝试从 API 加载（3秒超时）
  try {
    const resp = await fetch('/api/tools', { 
      cache: 'no-store', 
      signal: AbortSignal.timeout(3000) 
    });
    if (resp.ok) {
      const apiTools = await resp.json();
      if (Array.isArray(apiTools) && apiTools.length > 0) {
        tools = apiTools;
        renderAll();
        updateToolCount();
        return;
      }
    }
  } catch (e) {
    console.warn('API 加载失败，使用本地数据：', e.message);
  }

  // 兜底：使用 tools-data.js 中的 FALLBACK_TOOLS
  if (typeof FALLBACK_TOOLS !== 'undefined' && FALLBACK_TOOLS.length > 0) {
    tools = FALLBACK_TOOLS.map((t, i) => ({
      ...t,
      status: 'approved',
      id: t.id || (Date.now() + i)
    }));
  } else {
    tools = [];
  }
  renderAll();
  updateToolCount();
}

function renderAll() {
  renderFeatured();
  applyFilters();
  renderSidebar();
}

/** 本地热度兜底（远程不可用时使用） */
const HEAT_DATA = {
  // === AI对话（最热门）===
  1:98, 2:95, 3:88, 4:82, 5:79, 6:76,
  13:71, 14:68, 15:63, 16:58, 17:52, 18:48,
  // === AI绘图 ===
  21:92, 22:85, 23:80, 24:75, 25:70, 26:65,
  28:60, 29:72, 30:55, 31:50, 32:45, 33:42, 34:38,
  // === AI视频 ===
  41:86, 42:78, 43:66, 44:56, 45:51,
  46:74, 47:49, 48:69, 49:44, 50:39,
  // === AI编程 ===
  51:90, 52:84, 53:77, 54:67, 55:59,
  66:62, 68:46, 69:81, 80:73, 71:40,
  // === AI写作 ===
  61:54, 62:47, 63:41, 64:36,
  85:35, 86:31, 87:37, 88:33, 89:29,
  // === AI音频 ===
  71:43, 72:38, 73:34, 74:30,
  104:32, 105:57, 106:42, 107:28,
  // === AI搜索/办公/设计/翻译 ===
  81:53, 82:48, 83:39, 84:33,
  91:61, 92:56, 93:44, 144:64, 145:49, 146:40, 147:34,
  101:52, 102:45, 103:37, 164:41, 165:67, 166:30, 167:36, 168:26,
  111:38, 112:33, 183:35, 184:31,
  // === AI学习/智能体 ===
  121:32, 122:27, 123:23, 203:25, 204:22,
  131:30, 132:24, 224:28, 225:21, 226:19,
  // AI 3D / 图像处理 / 思维导图 / 简历 / 数据分析
  141:26, 142:21, 143:17, 243:23, 244:18, 245:15,
  261:20, 262:24, 263:19, 281:27, 282:16, 283:14,
  301:21, 302:17, 303:15,   321:18, 322:25, 323:13,
};

/** 本地收录日期兜底（远程不可用时使用） */
const LATEST_DATES = {
  321:'2026-06-05', 322:'2026-06-04', 323:'2026-06-03',
  301:'2026-05-30', 302:'2026-05-28', 303:'2026-05-25',
  281:'2026-05-22', 282:'2026-05-20', 283:'2026-05-18',
  261:'2026-05-15', 262:'2026-05-12', 263:'2026-05-10',
  245:'2026-05-08', 244:'2026-05-05', 225:'2026-05-02', 226:'2026-04-30',
  204:'2026-04-25', 166:'2026-04-22', 169:'2026-04-18',
  146:'2026-04-15', 147:'2026-04-12', 168:'2026-04-10',
  105:'2026-04-08', 48:'2026-04-05', 69:'2026-04-02', 80:'2026-03-30',
  29:'2026-03-28', 46:'2026-03-25', 30:'2026-03-22',
  88:'2026-03-18', 89:'2026-03-15', 87:'2026-03-12',
  33:'2026-03-08', 15:'2026-03-05', 16:'2026-03-01',
};

/** 记录用户本地点击（localStorage） */
function trackClick(toolId) {
  if (!toolId) return;
  try {
    const clicks = JSON.parse(localStorage.getItem('ai_nav_clicks') || '{}');
    clicks[toolId] = (clicks[toolId] || 0) + 1;
    localStorage.setItem('ai_nav_clicks', JSON.stringify(clicks));
  } catch(_) {}
}

function updateToolCount() {
  const approved = tools.filter(t => t.status === 'approved' || !t.status);
  const count = approved.length;
  const text = count >= 300 ? '300+' : String(count);
  document.querySelectorAll('#toolCount').forEach(el => el.textContent = text);
  document.querySelectorAll('#statTools').forEach(el => el.textContent = text);
}

// ===== 渲染函数 =====
function getBadgeHtml(badge) {
  if (!badge) return '';
  const map = { hot:'badge-hot', new:'badge-new', free:'badge-free', paid:'badge-paid' };
  const text = { hot:'🔥热门', new:'✨新上', free:'免费', paid:'付费' };
  return `<span class="badge ${map[badge]||''}">${text[badge]||badge}</span>`;
}

function renderFeatured() {
  const featured = tools.filter(t => t.featured && (t.status === 'approved' || !t.status));
  const el = document.getElementById('featuredGrid');
  if (!el) return;
  el.innerHTML = featured.map(t => `
    <a class="featured-large" href="${t.url}" target="_blank" rel="noopener" onclick="trackClick('${t.id}')">
      ${t.badge === 'hot' ? '<span class="hot-flag">🔥 热门</span>' : ''}
      <div class="featured-top">
        <div class="featured-logo">${t.logo}</div>
        <div class="featured-info">
          <div class="name">${t.name}</div>
          <div style="display:flex;gap:4px">${(t.tags||[]).slice(0,2).map(tag => `<span class="badge badge-free">${tag}</span>`).join('')}</div>
        </div>
      </div>
      <div class="featured-desc">${t.desc}</div>
      <div class="featured-tags">
        <span class="featured-tag">${categories[t.cat]?.icon||'⚡'} ${categories[t.cat]?.label||'其他'}</span>
      </div>
      <div class="featured-cta">立即访问 →</div>
    </a>
  `).join('');
}

function renderSections(filtered) {
  const catOrder = ['chat','image','video','code','write','audio','search','ppt','design','translate','edu','agent','3d','other'];
  const bycat = {};
  filtered.forEach(t => { if(!bycat[t.cat]) bycat[t.cat]=[]; bycat[t.cat].push(t); });

  const sections = (currentCat === 'all' ? catOrder : [currentCat]).filter(c => bycat[c]?.length);
  const el = document.getElementById('toolSections');
  if (!el) return;

  el.innerHTML = sections.map(cat => {
    const items = bycat[cat];
    const catInfo = categories[cat] || {label:cat, icon:'⚡'};
    return `
      <div class="section-header" id="sec-${cat}">
        <span class="section-icon">${catInfo.icon}</span>
        <span class="section-title">${catInfo.label}</span>
        <span class="section-count">${items.length} 个工具</span>
      </div>
      <div class="tool-grid">
        ${items.map(t => `
          <a class="tool-card ${t.featured?'featured-card':''}" href="${t.url}" target="_blank" rel="noopener" onclick="trackClick('${t.id}')">
            <div class="card-top">
              <div class="tool-logo">${t.logo}</div>
              <div class="card-meta">
                <div class="card-name">${t.name}</div>
                <div class="card-badges">
                  ${getBadgeHtml(t.badge)}
                  ${(t.tags||[])[0] ? `<span class="badge badge-free">${(t.tags||[])[0]}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="card-desc">${t.desc}</div>
            <div class="card-footer">
              <span class="card-cat-tag">${catInfo.icon} ${catInfo.label}</span>
              <span class="card-visit">访问 →</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }).join('');

  const hasResults = sections.length > 0;
  const noResult = document.getElementById('noResult');
  if (noResult) noResult.style.display = hasResults ? 'none' : 'block';
}

function renderSidebar() {
  renderRanking();
  renderLatest();
}

/** 格式化时间：返回 "今天/昨天/N天前" */
function timeAgo(dateStr) {
  if (!dateStr) return '近期';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff < 1) return '今天';
  if (diff < 2) return '昨天';
  if (diff <= 5) return `${diff}天前`;
  if (diff <= 30) return `${Math.floor(diff / 7)}周前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ===== 热度排行（远程数据优先，本地兜底）=====
function renderRanking() {
  const rankEl = document.getElementById('rankList');
  if (!rankEl) return;
  // 按远程/本地热度值降序排列
  const sorted = [...tools]
    .filter(t => getToolHeat(t.id) > 0)
    .sort((a, b) => getToolHeat(b.id) - getToolHeat(a.id))
    .slice(0, 8);
  // 如果工具太少，补充没有热度数据的工具
  if (sorted.length < 8) {
    const rest = tools
      .filter(t => getToolHeat(t.id) === 0 && !sorted.includes(t))
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 8 - sorted.length);
    sorted.push(...rest);
  }
  rankEl.innerHTML = sorted.map((t, i) => {
    const heat = getToolHeat(t.id);
    const heatDisplay = heat >= 1000 ? (heat / 1000).toFixed(1) + 'k' : heat;
    return `
    <li>
      <span class="rank-num">${i + 1}</span>
      <span class="rank-name">${t.name}</span>
      <span class="rank-heat">${heat || Math.floor(10 + Math.max(0,20-i*2))}k</span>
    </li>`;
  }).join('');
}

// ===== 最新收录（远程日期优先，本地兜底）=====
function renderLatest() {
  const updateEl = document.getElementById('updateList');
  if (!updateEl) return;
  // 按 id 倒序（最新添加的工具 id 最大）
  const newest = [...tools].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 8);
  updateEl.innerHTML = newest.map(t => {
    // 有远程/模拟日期就用，否则根据 id 算一个
    let dateStr = getToolAddedAt(t.id);
    if (!dateStr) {
      const baseDate = new Date('2026-06-07');
      const daysAgo = Math.max(1, Math.floor((330 - (t.id||0)) / 3));
      baseDate.setDate(baseDate.getDate() - daysAgo);
      dateStr = baseDate.toISOString().split('T')[0];
    }
    return `<li><span class="update-dot"></span>${t.name}<span class="update-time">${timeAgo(dateStr)}</span></li>`;
  }).join('');
}

// ===== 筛选逻辑 =====
function filterCategory(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('.cat-tab').forEach(t => {
      if(t.textContent.includes(categories[cat]?.label)) t.classList.add('active');
    });
  }
  applyFilters();
  const sec = document.getElementById('sec-' + cat);
  if (sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
  else window.scrollTo({top: document.querySelector('.main-content')?.offsetTop - 120 || 0, behavior:'smooth'});
}

function handleSearch(val) {
  searchQuery = val.toLowerCase().trim();
  const el1 = document.getElementById('heroSearch');
  const el2 = document.getElementById('headerSearch');
  if (el1) el1.value = val;
  if (el2) el2.value = val;
  applyFilters();
}

function filterByKeyword(kw) {
  searchQuery = kw.toLowerCase();
  const el1 = document.getElementById('heroSearch');
  const el2 = document.getElementById('headerSearch');
  if (el1) el1.value = kw;
  if (el2) el2.value = kw;
  currentCat = 'all';
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  const firstTab = document.querySelector('.cat-tab');
  if (firstTab) firstTab.classList.add('active');
  applyFilters();
  const main = document.querySelector('.main-content');
  if (main) main.scrollIntoView({behavior:'smooth'});
}

function applyFilters() {
  let filtered = tools.filter(t => t.status === 'approved' || !t.status);
  if (currentCat !== 'all') filtered = filtered.filter(t => t.cat === currentCat);
  if (searchQuery) {
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(searchQuery) ||
      t.desc.toLowerCase().includes(searchQuery) ||
      (t.tags||[]).join(' ').toLowerCase().includes(searchQuery)
    );
  }
  renderSections(filtered);
  const showFeatured = !searchQuery && currentCat === 'all';
  const secFeatured = document.getElementById('sec-featured');
  const gridFeatured = document.getElementById('featuredGrid');
  if (secFeatured) secFeatured.style.display = showFeatured ? 'flex' : 'none';
  if (gridFeatured) gridFeatured.style.display = showFeatured ? 'grid' : 'none';
}

// ===== 提交工具（API版）=====
async function handleSubmit(e) {
  e.preventDefault();

  const okName = validateField('f_name','err_name', v => v.length >= 1);
  const okUrl  = validateField('f_url','err_url', v => { try{const u=new URL(v);return['http:','https:'].includes(u.protocol)}catch{return false} });
  const okDesc = validateField('f_desc','err_desc', v => v.length >= 10);
  const okCat  = validateField('f_cat','err_cat', v => v !== '');
  const okEmail= validateField('f_email','err_email', v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));

  if (!okName || !okUrl || !okDesc || !okCat || !okEmail) {
    showToast('请检查红色标注的字段', 'error');
    return;
  }

  const btn = document.getElementById('submitBtn');
  const spin = document.getElementById('submitSpin');
  const btnText = document.getElementById('submitBtnText');
  btn.disabled = true;
  spin.style.display = 'block';
  btnText.textContent = '提交中...';

  const getSelectedTags = () => [...document.querySelectorAll('.form-tag.selected')].map(el => el.textContent.trim());

  const record = {
    name: document.getElementById('f_name').value.trim(),
    url: document.getElementById('f_url').value.trim(),
    desc: document.getElementById('f_desc').value.trim(),
    cat: document.getElementById('f_cat').value,
    pricing: document.getElementById('f_pricing').value,
    tags: getSelectedTags(),
    email: document.getElementById('f_email').value.trim(),
    relation: document.getElementById('f_relation').value,
    authorNote: document.getElementById('f_author_note')?.value?.trim() || '',
  };

  try {
    const resp = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const result = await resp.json();

    btn.disabled = false;
    spin.style.display = 'none';
    btnText.textContent = '🚀 提交审核';

    if (resp.ok && result.ok) {
      document.getElementById('submitForm').style.display = 'none';
      document.getElementById('submitSuccess').style.display = 'block';
      document.getElementById('successId').querySelector('span').textContent = result.id || '---';
      showToast('提交成功！等待审核 🎉', 'success');
    } else {
      showToast(result.error || '提交失败，请重试', 'error');
    }
  } catch (err) {
    btn.disabled = false;
    spin.style.display = 'none';
    btnText.textContent = '🚀 提交审核';
    showToast('网络错误，已保存到本地（离线模式）', 'info');
    // 离线降级：保存到 localStorage
    const id = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
    const localRecord = { ...record, id, status:'pending', createdAt: new Date().toISOString() };
    const list = JSON.parse(localStorage.getItem('ai_nav_offline_submits')||'[]');
    list.unshift(localRecord);
    localStorage.setItem('ai_nav_offline_submits', JSON.stringify(list));
  }
}

// ===== 管理后台（纯前端模式）=====
let currentAdminTab = 'pending';
let ADMIN_TOKEN = localStorage.getItem('ai_nav_admin_token') || '';
let useLocalAdmin = false; // 是否使用本地模式

function openAdminModal() {
  if (!ADMIN_TOKEN) {
    const token = prompt('请输入管理 Token（任意密码即可）：');
    if (!token) return;
    ADMIN_TOKEN = token;
    localStorage.setItem('ai_nav_admin_token', token);
  }
  loadAdminData();
  document.getElementById('adminModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

async function loadAdminData() {
  // 先尝试从 API 加载
  try {
    const resp = await fetch('/api/admin/tools', {
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.status === 401) {
      localStorage.removeItem('ai_nav_admin_token');
      ADMIN_TOKEN = '';
      alert('Token 无效，请重新打开管理后台');
      closeAdminModal();
      return;
    }
    if (resp.ok) {
      const list = await resp.json();
      useLocalAdmin = false;
      renderAdminStats(list);
      renderAdminContent(list, currentAdminTab);
      return;
    }
  } catch (_) {
    // API 不可用，降级到本地模式
  }

  // 降级：从 localStorage 加载离线提交数据
  useLocalAdmin = true;
  try {
    const list = JSON.parse(localStorage.getItem('ai_nav_offline_submits') || '[]');
    renderAdminStats(list);
    renderAdminContent(list, currentAdminTab);
    console.log('[管理后台] 使用本地存储模式（后端 API 不可用）');
  } catch (e) {
    showToast('加载管理数据失败', 'error');
  }
}

function renderAdminStats(list) {
  const counts = { pending:0, approved:0, rejected:0 };
  list.forEach(r => counts[r.status] = (counts[r.status]||0) + 1);
  const el = document.getElementById('adminStats');
  if (!el) return;
  el.innerHTML = `
    <div class="admin-stat"><div class="num">${list.length}</div><div class="lbl">总提交</div></div>
    <div class="admin-stat"><div class="num" style="color:#fdcb6e">${counts.pending}</div><div class="lbl">待审核</div></div>
    <div class="admin-stat"><div class="num" style="color:#00b894">${counts.approved}</div><div class="lbl">已通过</div></div>
    <div class="admin-stat"><div class="num" style="color:#e17055">${counts.rejected}</div><div class="lbl">已拒绝</div></div>
  `;
}

function renderAdminContent(list, tab) {
  const filtered = list.filter(r => r.status === tab);
  const el = document.getElementById('adminContent');
  if (!el) return;

  if (!filtered.length) {
    el.innerHTML = `<div class="admin-empty">暂无${tab==='pending'?'待审核':tab==='approved'?'通过':'拒绝'}的记录</div>`;
    return;
  }

  const catEmoji = { chat:'💬',image:'🎨',video:'🎬',code:'💻',write:'✍️',audio:'🎵',search:'🔍',ppt:'📊',design:'🖌️',translate:'🌐',edu:'📚',agent:'🤖','3d':'🧊',other:'⚡' };

  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr>
      <th>工具名称</th><th>分类</th><th>提交时间</th>
      <th>${tab==='pending'?'操作':'操作'}</th>
    </tr></thead>
    <tbody>
      ${filtered.map(r => `<tr>
        <td>
          <div style="font-weight:600;color:var(--text)">${r.name}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${(r.desc||'').slice(0,40)}${(r.desc||'').length>40?'...':''}</div>
          <div><a href="${r.url}" target="_blank" style="font-size:11px;color:var(--primary-light)">${(r.url||'').slice(0,40)}...</a></div>
        </td>
        <td>${catEmoji[r.cat]||'⚡'} ${r.cat}</td>
        <td style="white-space:nowrap;font-size:12px">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
        <td>
          ${tab==='pending' ? `
            <button class="admin-action-btn btn-approve" onclick="adminApprove('${r.id}')">✅ 通过</button>
            <button class="admin-action-btn btn-reject" onclick="adminReject('${r.id}')">❌ 拒绝</button>
          ` : ''}
          <button class="admin-action-btn btn-delete" onclick="adminDelete('${r.id}')">🗑 删除</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

async function adminApprove(id) {
  if (!confirm('确认通过此工具？通过后将在前台展示。')) return;
  if (useLocalAdmin) {
    // 本地模式：修改 localStorage
    let list = JSON.parse(localStorage.getItem('ai_nav_offline_submits') || '[]');
    const item = list.find(r => r.id === id);
    if (item) { item.status = 'approved'; item.reviewedAt = new Date().toISOString(); }
    localStorage.setItem('ai_nav_offline_submits', JSON.stringify(list));
    showToast('已通过（本地模式）', 'success');
    loadAdminData();
    return;
  }
  try {
    const resp = await fetch(`/api/admin/tools?id=${id}&action=approve`, {
      method: 'PUT',
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.ok) {
      showToast('已通过审核', 'success');
      loadAdminData();
      loadTools();
    }
  } catch { showToast('操作失败', 'error'); }
}

async function adminReject(id) {
  if (!confirm('确认拒绝此提交？')) return;
  if (useLocalAdmin) {
    let list = JSON.parse(localStorage.getItem('ai_nav_offline_submits') || '[]');
    const item = list.find(r => r.id === id);
    if (item) { item.status = 'rejected'; item.reviewedAt = new Date().toISOString(); }
    localStorage.setItem('ai_nav_offline_submits', JSON.stringify(list));
    showToast('已拒绝（本地模式）', 'error');
    loadAdminData();
    return;
  }
  try {
    const resp = await fetch(`/api/admin/tools?id=${id}&action=reject`, {
      method: 'PUT',
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.ok) { showToast('已拒绝', 'error'); loadAdminData(); }
  } catch { showToast('操作失败', 'error'); }
}

async function adminDelete(id) {
  if (!confirm('确认删除此记录？')) return;
  if (useLocalAdmin) {
    let list = JSON.parse(localStorage.getItem('ai_nav_offline_submits') || '[]');
    list = list.filter(r => r.id !== id);
    localStorage.setItem('ai_nav_offline_submits', JSON.stringify(list));
    showToast('已删除（本地模式）', 'info');
    loadAdminData();
    loadTools();
    return;
  }
  try {
    const resp = await fetch(`/api/admin/tools?id=${id}`, {
      method: 'DELETE',
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.ok) { showToast('已删除', 'info'); loadAdminData(); loadTools(); }
  } catch { showToast('操作失败', 'error'); }
}

function switchAdminTab(tab, btn) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadAdminData();
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('active');
  document.body.style.overflow = '';
}
function handleAdminOverlayClick(e) {
  if (e.target === document.getElementById('adminModal')) closeAdminModal();
}

// ===== 工具函数 =====
function showToast(msg, type='info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  el.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function updateCharCount(el, countId, max) {
  const el2 = document.getElementById(countId);
  if (el2) el2.textContent = el.value.length;
}

function toggleTag(el) {
  el.classList.toggle('selected');
}

function validateField(id, errId, checkFn) {
  const el = document.getElementById(id);
  const err = document.getElementById(errId);
  const ok = checkFn(el.value.trim());
  el.classList.toggle('error', !ok);
  err.classList.toggle('show', !ok);
  return ok;
}

function resetSubmitForm() {
  document.getElementById('submitForm').style.display = 'block';
  const succ = document.getElementById('submitSuccess');
  if (succ) succ.style.display = 'none';
  document.getElementById('submitForm').reset();
  const cnt = document.getElementById('f_desc_count');
  if (cnt) cnt.textContent = '0';
  document.querySelectorAll('.form-tag.selected').forEach(t => t.classList.remove('selected'));
  document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
}

function openSubmitModal() {
  resetSubmitForm();
  document.getElementById('submitModal').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('f_name')?.focus(), 200);
}
function closeSubmitModal() {
  document.getElementById('submitModal').classList.remove('active');
  document.body.style.overflow = '';
}
function handleOverlayClick(e) {
  if (e.target === document.getElementById('submitModal')) closeSubmitModal();
}

// ===== 初始化 =====
async function initApp() {
  const relSel = document.getElementById('f_relation');
  if (relSel) {
    relSel.addEventListener('change', function() {
      const group = document.getElementById('authorNoteGroup');
      if (group) group.style.display =
        (this.value === '作者' || this.value === '合作') ? 'block' : 'none';
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSubmitModal(); closeAdminModal(); }
  });

  // 并行加载：工具数据 + 远程统计数据
  await Promise.all([loadTools(), loadRemoteStats()]);

  // 数据加载完成后重新渲染侧边栏（使用远程数据）
  renderSidebar();

  // 读取 ?cat=xxx 参数，加载完成后自动筛选分类
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('cat');

  await loadTools();

  if (catParam && categories[catParam]) {
    filterCategory(catParam, null);
    // 滚动到分类区域
    setTimeout(() => {
      const mainEl = document.querySelector('.main-content');
      if (mainEl) mainEl.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}

// 兼容处理：app.js 在 body 末尾加载，DOM 可能已就绪
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
