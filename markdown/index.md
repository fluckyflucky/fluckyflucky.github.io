---
layout: home

hero:
  name: "青い夏"
  tagline: "explorer, recorder, and creator"

features:
  - title: 笔记
    details: 造轮子时的笔记。主要是技术实践、学习心得
    link: /notes/notes
  - title: 夏日记忆
    details: 一些突如其来的想法、随笔。非技术性内容为主
    link: /thoughts/thoughts
  - title: 图库
    link: /images/images
    details: 镜头下那些转瞬即逝的美。未来也考虑把画放在这里。
  - title: 工具箱
    link: /tools/tools
    details: 一些纯前端的开发小工具，JSON 格式化、Base64 编解码、时间戳转换等。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(135deg, #23e5eb 30%, #41d1ff);
}
</style>

<div class="home-bottom">

## Recommendation

如果你不知道从哪里开始，可以看看：

* [[后端] JSON 反序列化中 TypeReference 的使用](./notes/jackson-type-reference) — *2025-12-29*
* [[后端] Gin 框架分层：经典的洋葱模型](./notes/gin-layered-architecture) — *2025-9-15*

---

<div class="about-section">

### About me

同济大学计科大三在读，数据/前端/后端/移动开发

爱好旅行、摄影、做有意思的事情，一直在追逐永无止境的夏。

Github：[https://github.com/fluckyflucky](https://github.com/fluckyflucky)

</div>

---

<footer class="site-footer">
  <span>powered by <a href="https://vitepress.dev/">VitePress</a></span>
  <span class="footer-divider">·</span>
  <span>終わらない夏</span>
</footer>

</div>

<style>
.home-bottom {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.about-section {
  padding: 4px 0;
}

.site-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
  opacity: 0.7;
  letter-spacing: 0.5px;
}

.footer-divider {
  opacity: 0.4;
}

.site-footer a {
  color: var(--vp-c-brand-1);
}
</style>
