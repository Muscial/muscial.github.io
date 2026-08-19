# Muscial Anime List · MAL

Muscial 的个人动画观看档案（Anime Archive）——收录看过的番剧、补番列表、博客杂谈与友链，星空/档案风格主题。纯静态站点，可直接部署到 GitHub Pages。

功能上仿照 ak2ne0.cn 的 AAL 站点（已遍历其全部接口功能后重写实现）：

| 功能 | 对应页面 | 原站接口 |
|---|---|---|
| 开机启动屏 / 星空背景 | `index.html` | BootScreen / StarfieldLoader |
| Hero + 个人档案头像 | `index.html` | Hero |
| 观看统计（总数/年跨度/均分/笔记数） | `index.html#overview` | `/api/admin/state` 的 stats |
| TOP 10 轨道选择器 | `index.html#top10` | `/api/admin/top` |
| ANIME LIST 时间线（搜索 + 年份筛选） | `index.html?tab=anime` | anime CRUD |
| BACKLOG 补番列表（按季度分组 + 期待值） | `index.html?tab=watchlist` | `/api/admin/watchlist` CRUD + `/complete` |
| BLOG 笔记（Markdown 渲染，`#note-slug` 直达） | `index.html?tab=blog` | `/api/admin/blog` CRUD |
| 友链页 + 个人档案 | `friends.html` | `/api/friends`, `/api/friend-assets/*` |
| DOCTOR 管理终端（登录/增删改查/导入导出） | `admin.html` | `/api/auth/*`, `/api/admin/*` |

## 部署

```bash
git clone https://github.com/Muscial/muscial.github.io.git
# 直接推送根目录即可，GitHub Pages 自动生效（Settings → Pages → Deploy from a branch）
```

## 目录结构

```
├── index.html            # 首页（boot / hero / 统计 / TOP10 / 三个 Tab）
├── friends.html          # 友链页
├── admin.html            # DOCTOR 管理终端
├── 404.html / favicon.svg / og.svg
├── css/style.css         # 全部样式（原创）
├── js/
│   ├── util.js           # 数据读写 / 统计 / i18n / 页脚
│   ├── starfield.js      # Canvas 星空背景
│   ├── markdown.js       # 轻量 Markdown 渲染器
│   ├── app.js            # 首页逻辑
│   ├── friends.js        # 友链页逻辑
│   └── admin.js          # 管理终端逻辑
├── data/
│   ├── site-data.js      # 种子数据 window.SEED_DATA（设置/番剧/补番/友链/Top10）
│   ├── posts-index.js    # 博客文章清单
│   └── posts/*.md        # 博客正文（含旧博客迁移文章）
└── img/
    ├── blog_images/      # 博客配图（旧站迁移保留）
    └── friends/*.svg     # 友链头像
```

## 数据与后台

GitHub Pages 无法运行后端，管理终端采用「客户端存储」方案：

- 所有编辑先写入浏览器 `localStorage`（键 `mal-data-v1`），仅本设备生效，适合预览调试；
- 要全网生效：在 DOCTOR → SETTINGS 中 **EXPORT FULL DATA** 导出 JSON，
  用其替换 `data/site-data.js` 里的 `window.SEED_DATA = {...}` 并提交推送；
- 封面图直连 Bangumi CDN（`lain.bgm.tv`），加载失败自动回退首字母占位图；
- 后台「ADD VIA BANGUMI SEARCH」与「COVERS SYNC」直接调用公开接口 `api.bgm.tv/v0`。

登录令牌默认 `mal-muscial-2026`，在 `data/site-data.js` 的 `settings.adminToken` 中修改。
注意：静态站点令牌在客户端可见，仅作形式保护，请勿存放敏感数据。

## 数据来源

- 番剧数据种子来自 Bangumi 公开 API（条目信息与封面版权归 Bangumi / 原作者所有）
- 初始演示数据为 ak2ne0.cn 站点公开页面的个人档案（可在后台替换为自己的数据）
- 博客文章为旧站 `muscial.github.io` 迁移内容

© Muscial · Anime metadata via Bangumi
