# Cloudflare Pages 部署完整指南

> 适用场景：AI 导航站（静态前端 + KV 存储后端）
> 预计耗时：30 分钟完成全部配置

---

## 准备工作

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up) 账号（免费）
2. 准备 `aidq123.cn` 域名的 DNS 管理权限

---

## 第一步：创建 KV 存储命名空间

1. 登录 Cloudflare 控制台 → 左侧菜单 **Storage** → **KV**
2. 点击 **Create a namespace**
3. 名称填写：`ai-nav-tools`
4. 记住 **Namespace ID**（后续需要）
5. 再创建一个用于管理的 namespace（可选）：`ai-nav-tools-preview`（预览环境用）

---

## 第二步：部署前端到 Cloudflare Pages

### 方式 A：连接 Git 仓库（推荐）

1. 把 `ai-nav/` 目录推送到 GitHub / GitLab 仓库
2. Cloudflare 控制台 → **Compute (Workers)** → **Pages** → **Create a project**
3. 选择 **Connect to Git**，授权并选择仓库
4. 配置构建选项：

| 字段 | 值 |
|------|-----|
| Framework preset | `None` |
| Build command | （留空） |
| Build output directory | `/` （根目录） |
| Root directory | `ai-nav` （如仓库根目录就是 ai-nav 则填 `/`） |

5. **重要：** 点击 **Environment variables** → **Add variable**：
   - Variable name: `AI_NAV_KV`
   - Value: （不填，在下一步绑定）

6. 点击 **Save and Deploy**，等待部署完成
7. 记录下默认域名：`https://xxx.pages.dev`

### 方式 B：直接上传文件夹（无需 Git）

1. Cloudflare 控制台 → **Pages** → **Upload assets**
2. 将 `ai-nav/` 目录压缩为 zip，上传
3. 输出目录填 `/`
4. 部署完成后记录默认域名

---

## 第三步：绑定 KV 到 Pages 项目

1. 进入刚创建的 Pages 项目 → **Settings** → **Functions**
2. 找到 **KV namespace bindings** → 点击 **Add KV namespace**
3. 填写：
   - Variable name: `AI_NAV_KV`（必须与 `functions/` 中的 `env.AI_NAV_KV` 一致）
   - KV namespace: 选择 `ai-nav-tools`
4. 如果是预览环境，也绑定 `ai-nav-tools-preview`
5. 点击 **Save**

---

## 第四步：初始化管理员密码

1. 进入 Pages 项目 → **Settings** → **Variables**
2. 点击 **Add a variable** → 选择 **Encrypt**
3. 名称：`ADMIN_TOKEN`（或直接在 KV 中设置，见下方）
4. 或者更简单：等部署完成后，第一次打开管理后台时，系统会自动提示设置密码（写入 KV）

> 推荐直接在 KV 中手动写入一条记录：
> - Key: `admin_token`
> - Value: 你自己设的密码（例如 `aidq123admin`）

---

## 第五步：绑定自定义域名 aidq123.cn

1. 在 Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `aidq123.cn`，点击 **Continue**
3. Cloudflare 会提示添加两条 DNS 记录，去你的域名注册商（阿里云/腾讯云等）的 DNS 控制台添加：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|----------|------|
| `CNAME` | `@` | `xxx.pages.dev` | 600 |
| `CNAME` | `www` | `xxx.pages.dev` | 600 |

4. 如果域名本身就在 Cloudflare 托管，会自动配置，无需手动加 DNS
5. 等待 DNS 生效（几分钟到几小时），SSL 证书自动签发

---

## 第六步：测试验证

部署完成后，按以下顺序验证：

### 1. 访问首页
- 打开 `https://aidq123.cn`
- 确认工具列表正常加载（此时应显示 `tools-data.js` 中的兜底数据）

### 2. 测试 API
```bash
# 浏览器控制台或命令行测试
curl https://aidq123.cn/api/tools
# 应返回 JSON 数组（此时为空或兜底数据）
```

### 3. 测试提交工具
- 点击首页「+ 提交工具」
- 填写表单提交
- 打开浏览器 Network 面板，确认 POST 到 `/api/submit` 返回 `{"ok":true}`

### 4. 测试管理后台
- 在首页按 `Ctrl+Shift+A`（或访问 `/api/admin/tools` 会 401）
- 输入管理员 Token（即 KV 中 `admin_token` 的值）
- 确认能看到提交列表并执行审核操作

---

## 第七步：导入初始数据（可选）

如果你想把 `tools-data.js` 中的 60+ 条工具一次性导入 KV：

**方法 A：用 Worker 脚本批量写入**
在 Cloudflare Workers 中临时创建一个脚本，读取数据并写入 KV。

**方法 B：手动逐条提交**
通过首页提交表单逐条提交（适合数据量少的场景）。

**方法 C：直接在 KV 编辑器写入**
Cloudflare 控制台 → Storage → KV → `ai-nav-tools` → 添加 Key：
- Key: `tools`
- Value: （粘贴 `tools-data.js` 中的 JSON 数组，注意去掉 `FALLBACK_TOOLS =` 前缀，只保留 `[...]` 部分）

---

## 常见问题

### Q：部署后 `/api/tools` 返回 404？
A：确认 `functions/` 目录已上传，且 Pages 项目已绑定 KV（第三步）。

### Q：CORS 错误？
A：`_middleware.js` 已处理 CORS，如仍有问题，检查请求是否带正确 Header。

### Q：管理后台打不开？
A：确认 KV 中已设置 `admin_token`，且在请求 Header 中带入 `Admin-Token`。

### Q：国内访问速度慢？
A：Cloudflare 在中国大陆无节点。可选方案：
- 套国内 CDN（腾讯云 CDN / 阿里云 CDN）
- 或改用腾讯云轻量服务器部署（见 `DEPLOY.md`）

---

## 文件清单

```
ai-nav/
├── index.html              # 前台页面（已改外部 JS 加载）
├── tools-data.js          # 兜底数据（API 挂掉时使用）
├── app.js                 # 主逻辑（API 加载 / 提交 / 管理）
├── style.css              # （可选）CSS 外部文件
├── robots.txt
├── sitemap.xml
├── functions/
│   ├── _middleware.js   # CORS 全局处理
│   ├── api/
│   │   ├── tools.js     # GET /api/tools
│   │   ├── submit.js    # POST /api/submit
│   │   └── admin/
│   │       └── tools.js # GET/PUT/DELETE /api/admin/tools
│   └── ...
├── wrangler.toml         # 本地开发配置（可选）
└── DEPLOY_CLOUDFLARE.md  # 本文件
```

---

## 本地开发（可选）

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV namespace（记录返回的 ID）
wrangler kv namespace create "ai-nav-tools"

# 填写 wrangler.toml 中的 KV ID
# 然后启动本地开发服务器
wrangler pages dev ./ --kv=ai-nav-tools
```

---

*部署完成后，你的 AI 导航站就拥有完整的动态数据能力了 🎉*
