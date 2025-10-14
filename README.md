MyWeb
===

- 主页：<https://tloml-starry.github.io/MyWeb/>

项目说明
---

一个用 GitHub Pages 托管的小型多页面站点，聚合了若干实用小工具与个人页面。

主要入口
---

- Sky：`/Sky/index.html`
  - 光遇相关工具集合
  - 直达：身高查询 `/Sky/HeightQuery/index.html`
  - 直达：碎片查询 `/Sky/ShardQuery/index.html`
- LifeTimer：`/LifeTimer/index.html`
- MyAndLove：`/MyAndLove/index.html`
- BotHelp：`/BotHelp/index.html`

开发与结构
---

- 无构建依赖，原生 HTML/CSS/JS
- 站点地图：`/sitemap.xml`
- Robots：`/robots.txt`
- 404 页面：`/404.html`

本地预览
---

使用任意静态服务器在项目根目录启动，例如：

```bash
npx http-server -p 8080 .
```

