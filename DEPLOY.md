# AI导航站 - 部署指南

## 域名：Aidq123.cn

---

## 方案一：Nginx 自托管服务器（推荐）

### 1. 上传文件
```bash
# 将 ai-nav/ 目录上传到服务器
scp -r ./ai-nav/ root@your-server:/var/www/aidq123/
```

### 2. Nginx 配置
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name aidq123.cn www.aidq123.cn;

    # SSL证书（Let's Encrypt 免费）
    ssl_certificate /etc/letsencrypt/live/aidq123.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aidq123.cn/privkey.pem;

    root /var/www/aidq123;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/html text/css application/javascript;

    # 缓存策略
    location ~* \.(css|js|png|jpg|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # HTTP → HTTPS 重定向
    if ($scheme = http) {
        return 301 https://$server_name$request_uri;
    }
}
```

### 3. 申请 SSL 证书（免费）
```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 申请证书（自动配置 Nginx）
certbot --nginx -d aidq123.cn -d www.aidq123.cn

# 自动续期
crontab -e
# 添加：0 2 * * * certbot renew --quiet
```

---

## 方案二：Vercel 部署（最简单，国际访问快）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录部署
cd ai-nav
vercel --name aidq123-nav

# 然后在 Vercel 控制台添加自定义域名 aidq123.cn
```

**Vercel 控制台配置域名：**
1. 进入项目 → Settings → Domains
2. 添加 `aidq123.cn` 和 `www.aidq123.cn`
3. 按提示在域名注册商设置 DNS 记录

---

## 方案三：Cloudflare Pages（国内访问优化）

```bash
# 直接拖拽 ai-nav 文件夹到 Cloudflare Pages 控制台
# https://pages.cloudflare.com/
```

**DNS 配置：**
1. 将域名 NS 转到 Cloudflare
2. 添加 CNAME 记录：`@ → aidq123-nav.pages.dev`

---

## 方案四：腾讯云 COS / 阿里云 OSS 静态托管

### 腾讯云 COS
1. 创建 Bucket，开启静态网站托管
2. 上传 `ai-nav/` 目录下所有文件
3. 绑定自定义域名 `aidq123.cn`
4. 开启 CDN 加速（国内访问必选）

### 需要的 DNS 记录
```
类型    主机记录    记录值                  TTL
A       @          [服务器IP]              600
A       www        [服务器IP]              600
CNAME   @          [CDN/Pages域名]        600
```

---

## 域名 DNS 最终配置（通用）

在域名注册商（阿里云/腾讯云/华为云等）控制台添加：

| 记录类型 | 主机记录 | 记录值              |
|---------|---------|-------------------|
| A       | @       | 你的服务器IP         |
| A       | www     | 你的服务器IP         |
| CNAME   | @       | your-cdn.domain.com |

---

## SEO 优化建议

已内置：
- ✅ meta description & keywords
- ✅ 语义化 HTML 结构
- ✅ 移动端响应式
- ✅ 页面加载速度优化

建议补充：
- [ ] 添加 sitemap.xml
- [ ] 添加 robots.txt  
- [ ] 百度/谷歌站长工具验证
- [ ] 结构化数据（Schema.org）

---

## 网站文件说明

```
ai-nav/
├── index.html     # 主页（全部内容，单文件）
└── DEPLOY.md      # 本文件
```

**维护联系：** submit@aidq123.cn
