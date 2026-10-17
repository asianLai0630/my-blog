
/* 全站文章目錄：自動讀取 H2 標題 */

(() => {
  function initArticleTOC() {
    const article = document.querySelector("article.detail");
    const body = article?.querySelector(".detail-body");

    if (!article || !body) return;

    const headings = [...body.querySelectorAll("h2")];
    if (!headings.length) return;

    // 移除舊目錄，避免重複
    const existing = article.querySelector(".article-toc");
    if (existing) existing.remove();

    // 建立目錄外框
    const toc = document.createElement("div");
    toc.className = "article-toc";

    const button = document.createElement("button");
    button.className = "toc-header";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "article-toc-panel");
    button.innerHTML =
      '<span>文章目錄</span><span class="toc-toggle">展開 ﹀</span>';

    const panel = document.createElement("div");
    panel.id = "article-toc-panel";
    panel.className = "toc-panel";
    panel.inert = true;

    const inner = document.createElement("div");
    inner.className = "toc-inner";

    const nav = document.createElement("nav");
    nav.className = "toc-content";
    nav.setAttribute("aria-label", "文章目錄");

    // 哈修塔特文章專屬的小字
    const descriptions = [
      "位置與交通",
      "歷史與文化",
      "小鎮風景與自然",
      "旅行心情與感受"
    ];

    const isHallstatt =
      /\/article-3(?:\.html)?\/?$/.test(window.location.pathname);

    // 自動產生目錄項目
    headings.forEach((heading, i) => {
      const id = "section-" + (i + 1);
      heading.id = id;

      const link = document.createElement("a");
      link.href = "#" + id;
      link.textContent = heading.textContent.trim();

      // 只有 article-3 加入灰色小字
      if (isHallstatt && descriptions[i]) {
        const small = document.createElement("span");
        small.className = "toc-description";
        small.textContent = `（${descriptions[i]}）`;
        link.appendChild(small);
      }

      nav.appendChild(link);
    });

    inner.appendChild(nav);
    panel.appendChild(inner);
    toc.append(button, panel);

    // 將目錄放在文章主圖下方
    const cover = article.querySelector(".detail-cover");

    if (cover) {
      cover.after(toc);
    } else {
      body.before(toc);
    }

    // 展開與收合
    button.addEventListener("click", () => {
      const isOpen = toc.classList.toggle("is-open");

      button.setAttribute("aria-expanded", String(isOpen));
      panel.inert = !isOpen;

      button.querySelector(".toc-toggle").textContent =
        isOpen ? "收合 ⌃" : "展開 ﹀";
    });

    // 點擊目錄，平滑捲動到文章標題
    nav.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#section-"]');
      if (!link) return;

      event.preventDefault();
      event.stopPropagation();

      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);

      if (!target) return;

      const top =
        target.getBoundingClientRect().top +
        window.scrollY - 110;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: reduced ? "instant" : "smooth"
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArticleTOC);
  } else {
    initArticleTOC();
  }
})();
