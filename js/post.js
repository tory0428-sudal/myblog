(function () {
  var titleEl = document.getElementById("post-title");
  var dateEl = document.getElementById("post-date");
  var categoryEl = document.getElementById("post-category");
  var contentEl = document.getElementById("post-content");

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

      var cat = typeof getCategoryBySlug === "function" ? getCategoryBySlug(meta.category) : null;
      if (cat && categoryEl) {
        categoryEl.textContent = cat.label;
        categoryEl.href = "index.html?cat=" + encodeURIComponent(cat.slug);
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
        });
    })
    .catch(function () {
      showNotFound();
    });

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
