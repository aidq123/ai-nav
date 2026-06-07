/**
 * app.js - AI导航站主逻辑（API版）
 * 加载顺序：tools-data.js（兜底）→ app.js（本文件）
 * 优先从 /api/tools 读取数据，失败则使用 FALLBACK_TOOLS
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
  other:  { label:'其他',     icon:'⚡' }
};

let tools = [];
let currentCat = 'all';
let searchQuery = '';

// ===== 加载工具数据 =====
async function loadTools() {
  // 先尝试从 API 加载
  try {
    const resp = await fetch('/api/tools', { cache: 'no-store' });
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
    <a class="featured-large" href="${t.url}" target="_blank" rel="noopener">
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
          <a class="tool-card ${t.featured?'featured-card':''}" href="${t.url}" target="_blank" rel="noopener">
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
  // 热度排行（随机模拟）
  const rankEl = document.getElementById('rankList');
  if (rankEl) {
    const shuffled = [...tools].sort(() => Math.random()-0.5).slice(0,8);
    rankEl.innerHTML = shuffled.map((t,i) => `
      <li>
        <span class="rank-num">${i+1}</span>
        <span class="rank-name">${t.name}</span>
        <span class="rank-heat">${Math.floor(Math.random()*50+50)}k</span>
      </li>
    `).join('');
  }

  // 最新收录
  const updateEl = document.getElementById('updateList');
  if (updateEl) {
    const newTools = tools.filter(t=>t.badge==='new').slice(0,6);
    const dates = ['今天','昨天','2天前','3天前','4天前','5天前'];
    updateEl.innerHTML = newTools.length ? newTools.map((t,i) => `
      <li><span class="update-dot"></span>${t.name}<span class="update-time">${dates[i]||'近期'}</span></li>
    `).join('') : '<li style="color:var(--text3)">暂无新收录工具</li>';
  }
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

// ===== 管理后台（API版）=====
let currentAdminTab = 'pending';
let ADMIN_TOKEN = localStorage.getItem('ai_nav_admin_token') || '';

function openAdminModal() {
  if (!ADMIN_TOKEN) {
    const token = prompt('请输入管理 Token：');
    if (!token) return;
    ADMIN_TOKEN = token;
    localStorage.setItem('ai_nav_admin_token', token);
  }
  loadAdminData();
  document.getElementById('adminModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

async function loadAdminData() {
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
    const list = await resp.json();
    renderAdminStats(list);
    renderAdminContent(list, currentAdminTab);
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
  try {
    const resp = await fetch(`/api/admin/tools?id=${id}&action=approve`, {
      method: 'PUT',
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.ok) {
      showToast('已通过审核', 'success');
      loadAdminData();
      loadTools(); // 刷新前台
    }
  } catch { showToast('操作失败', 'error'); }
}

async function adminReject(id) {
  if (!confirm('确认拒绝此提交？')) return;
  try {
    const resp = await fetch(`/api/admin/tools?id=${id}&action=reject`, {
      method: 'PUT',
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.ok) {
      showToast('已拒绝', 'error');
      loadAdminData();
    }
  } catch { showToast('操作失败', 'error'); }
}

async function adminDelete(id) {
  if (!confirm('确认删除此记录？')) return;
  try {
    const resp = await fetch(`/api/admin/tools?id=${id}`, {
      method: 'DELETE',
      headers: { 'Admin-Token': ADMIN_TOKEN }
    });
    if (resp.ok) {
      showToast('已删除', 'info');
      loadAdminData();
      loadTools();
    }
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
function initApp() {
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

  loadTools();
}

// 兼容处理：app.js 在 body 末尾加载，DOM 可能已就绪
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
