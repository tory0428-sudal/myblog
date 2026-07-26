(function () {
  var listEl = document.getElementById("post-list");

  fetch("posts/manifest.json")
    .then(function (res) {
      if (!res.ok) throw new Error("manifest load failed");
      return res.json();
    })
    .then(function (posts) {
      if (!posts.length) {
        listEl.innerHTML = '<li class="empty-state">아직 작성된 글이 없습니다.</li>';
        return;
      }

      posts.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      listEl.innerHTML = posts
        .map(function (post) {
          return (
            '<li>' +
            '<a class="post-item" href="post.html?slug=' + encodeURIComponent(post.slug) + '">' +
            '<h2 class="post-item-title">' + escapeHtml(post.title) + "</h2>" +
            '<div class="post-item-date">' + formatDate(post.date) + "</div>" +
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
