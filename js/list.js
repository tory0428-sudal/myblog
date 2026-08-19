(function () {
  var listEl = document.getElementById("post-list");
  var headingEl = document.getElementById("list-heading");
  var manifestPromise = null;

  function getManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch("posts/manifest.json").then(function (res) {
        if (!res.ok) throw new Error("manifest load failed");
        return res.json();
      });
    }
    return manifestPromise;
  }

  function currentSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get("cat") || "";
  }

  var projectsManifestPromise = null;

  function getProjectsManifest() {
    if (!projectsManifestPromise) {
      projectsManifestPromise = fetch("projects/manifest.json").then(function (res) {
        if (!res.ok) throw new Error("projects manifest load failed");
        return res.json();
      });
    }
    return projectsManifestPromise;
  }

  function projectCardHtml(project) {
    var href = "project.html?slug=" + encodeURIComponent(project.slug);
    var badge =
      '<a class="post-item-category" href="index.html?cat=project-cases" data-cat="project-cases">주택시공프로젝트</a>';
    return (
      '<li class="post-item">' +
      '<a class="post-item-image" href="' + href + '" tabindex="-1" aria-hidden="true">' +
      '<img src="' + project.cover + '" alt="">' +
      "</a>" +
      '<div class="post-item-body">' +
      '<div class="post-item-meta">' + badge + '<span class="post-item-date">' + formatDate(project.date) + "</span></div>" +
      '<h2 class="post-item-title"><a href="' + href + '">' + escapeHtml(project.title) + "</a></h2>" +
      '<p class="post-item-excerpt project-item-excerpt">' + escapeHtml(project.specs) + "</p>" +
      "</div>" +
      "</li>"
    );
  }

  function renderProjectCases() {
    if (headingEl) headingEl.textContent = "";
    getProjectsManifest()
      .then(function (projects) {
        if (headingEl) headingEl.textContent = "주택시공프로젝트 (" + projects.length + "개)";
        if (!projects.length) {
          listEl.innerHTML = '<li class="empty-state">아직 등록된 프로젝트가 없습니다.</li>';
          return;
        }
        listEl.innerHTML = projects.map(projectCardHtml).join("");
      })
      .catch(function () {
        listEl.innerHTML = '<li class="empty-state">프로젝트를 불러오지 못했습니다.</li>';
      });
  }

  function render(catSlug) {
    markActiveCategory(catSlug);
    listEl.innerHTML = '<li class="empty-state">불러오는 중...</li>';

    if (catSlug === "project-cases") {
      renderProjectCases();
      return;
    }

    getManifest()
      .then(function (allPosts) {
        var posts = catSlug
          ? allPosts.filter(function (p) {
              return p.category === catSlug;
            })
          : allPosts.slice();

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
              ? '<a class="post-item-category" href="index.html?cat=' + encodeURIComponent(cat.slug) + '" data-cat="' + escapeHtml(cat.slug) + '">' + escapeHtml(cat.label) + "</a>"
              : "";
            var image = post.image || (cat && cat.image) || "";
            var href = "post.html?slug=" + encodeURIComponent(post.slug);
            return (
              '<li class="post-item">' +
              '<a class="post-item-image" href="' + href + '" tabindex="-1" aria-hidden="true">' +
              (image ? '<img src="' + image + '" alt="">' : "") +
              "</a>" +
              '<div class="post-item-body">' +
              '<div class="post-item-meta">' + badge + '<span class="post-item-date">' + formatDate(post.date) + "</span></div>" +
              '<h2 class="post-item-title"><a href="' + href + '">' + escapeHtml(post.title) + "</a></h2>" +
              '<p class="post-item-excerpt">' + escapeHtml(post.excerpt || "") + "</p>" +
              "</div>" +
              "</li>"
            );
          })
          .join("");
      })
      .catch(function () {
        listEl.innerHTML = '<li class="empty-state">글 목록을 불러오지 못했습니다.</li>';
      });
  }

  render(currentSlug());

  var appListEl = document.querySelector(".app-list");
  if (appListEl) {
    getProjectsManifest()
      .then(function (projects) {
        if (!projects.length) return;
        appListEl.innerHTML = projects.map(projectCardHtml).join("");
      })
      .catch(function () {});
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[data-cat]");
    if (!link) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    var slug = link.getAttribute("data-cat") || "";
    if (slug === currentSlug()) return;
    var newUrl = slug ? "index.html?cat=" + encodeURIComponent(slug) : "index.html";
    history.pushState({ cat: slug }, "", newUrl);
    render(slug);
  });

  window.addEventListener("popstate", function () {
    render(currentSlug());
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
      card.classList.toggle("is-active", card.getAttribute("data-cat") === slug);
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
