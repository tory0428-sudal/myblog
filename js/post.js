(function () {
  var titleEl = document.getElementById("post-title");
  var dateEl = document.getElementById("post-date");
  var categoryEl = document.getElementById("post-category");
  var contentEl = document.getElementById("post-content");
  var prevEl = document.getElementById("post-nav-prev");
  var nextEl = document.getElementById("post-nav-next");
  var backLinkEl = document.getElementById("post-back-link");
  var listLinkEl = document.getElementById("post-list-link");

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug");

  if (!slug) {
    showNotFound();
    return;
  }

  fetch("posts/manifest.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (posts) {
      var meta = posts.find(function (p) {
        return p.slug === slug;
      });

      if (!meta) {
        showNotFound();
        return;
      }

      document.title = meta.title;
      titleEl.textContent = meta.title;
      dateEl.textContent = formatDate(meta.date);
      renderNav(posts, meta);

      var cat = typeof getCategoryBySlug === "function" ? getCategoryBySlug(meta.category) : null;
      var listHref = cat ? "index.html?cat=" + encodeURIComponent(cat.slug) : "index.html";
      if (backLinkEl) backLinkEl.href = listHref;
      if (listLinkEl) listLinkEl.href = listHref;

      if (cat && categoryEl) {
        categoryEl.textContent = cat.label;
        categoryEl.href = listHref;
      } else if (categoryEl) {
        categoryEl.style.display = "none";
      }

      return fetch("posts/" + encodeURIComponent(slug) + ".md")
        .then(function (res) {
          if (!res.ok) throw new Error("md load failed");
          return res.text();
        })
        .then(function (md) {
          contentEl.innerHTML = marked.parse(md);
          var firstH1 = contentEl.querySelector("h1:first-child");
          if (firstH1) firstH1.remove();
        });
    })
    .catch(function () {
      showNotFound();
    });

  function renderNav(posts, currentMeta) {
    if (!prevEl || !nextEl) return;

    var sameCategory = posts.filter(function (p) {
      return p.category === currentMeta.category;
    });
    var sorted = sameCategory.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    var index = sorted.findIndex(function (p) {
      return p.slug === currentMeta.slug;
    });
    if (index === -1) return;

    var newer = index > 0 ? sorted[index - 1] : null;
    var older = index < sorted.length - 1 ? sorted[index + 1] : null;

    setNavLink(prevEl, older);
    setNavLink(nextEl, newer);
  }

  function setNavLink(el, post) {
    if (!post) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.href = "post.html?slug=" + encodeURIComponent(post.slug);
    el.querySelector(".post-nav-title").textContent = post.title;
  }

  function showNotFound() {
    titleEl.textContent = "글을 찾을 수 없습니다";
    dateEl.textContent = "";
    contentEl.innerHTML = '<p class="empty-state">요청하신 글이 존재하지 않습니다. <a href="index.html">목록으로 돌아가기</a></p>';
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  }
})();
