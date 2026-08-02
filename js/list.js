(function () {
  var listEl = document.getElementById("post-list");
  var headingEl = document.getElementById("list-heading");

  var params = new URLSearchParams(window.location.search);
  var catSlug = params.get("cat") || "";

  markActiveCategory(catSlug);

  fetch("posts/manifest.json")
    .then(function (res) {
      if (!res.ok) throw new Error("manifest load failed");
      return res.json();
    })
    .then(function (posts) {
      if (catSlug) {
        posts = posts.filter(function (p) {
          return p.category === catSlug;
        });
      }

      renderHeading(catSlug, posts.length);

      if (!posts.length) {
        listEl.innerHTML = '<li class="empty-state">아직 작성된 글이 없습니다.</li>';
        return;
      }

      posts.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      listEl.innerHTML = posts
        .map(function (post) {
          var cat = typeof getCategoryBySlug === "function" ? getCategoryBySlug(post.category) : null;
          var badge = cat
            ? '<a class="post-item-category" href="index.html?cat=' + encodeURIComponent(cat.slug) + '">' + escapeHtml(cat.label) + "</a>"
            : "";
          return (
            '<li>' +
            '<a class="post-item" href="post.html?slug=' + encodeURIComponent(post.slug) + '">' +
            '<h2 class="post-item-title">' + escapeHtml(post.title) + "</h2>" +
            '<div class="post-item-meta">' + badge + '<span class="post-item-date">' + formatDate(post.date) + "</span></div>" +
            '<p class="post-item-excerpt">' + escapeHtml(post.excerpt || "") + "</p>" +
            "</a>" +
            "</li>"
          );
        })
        .join("");
    })
    .catch(function () {
      listEl.innerHTML = '<li class="empty-state">글 목록을 불러오지 못했습니다.</li>';
    });

  function renderHeading(slug, count) {
    if (!headingEl) return;
    var label = "전체보기";
    if (slug && typeof getCategoryBySlug === "function") {
      var cat = getCategoryBySlug(slug);
      if (cat) label = cat.label + " · " + cat.sub;
    }
    headingEl.textContent = label + " (" + count + "개의 글)";
  }

  function markActiveCategory(slug) {
    var cards = document.querySelectorAll(".category-card");
    cards.forEach(function (card) {
      if (card.getAttribute("data-cat") === slug) {
        card.classList.add("is-active");
      }
    });
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
