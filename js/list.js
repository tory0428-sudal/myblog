(function () {
  var listEl = document.getElementById("post-list");
  var headingEl = document.getElementById("list-heading");
  var manifestPromise = null;
  var PAGE_SIZE = 8;

  // Renders the first PAGE_SIZE items into containerEl and, if there are more,
  // inserts a "전체글보기" button right after containerEl that reveals the rest
  // in place when clicked. wrapId must be unique per container so repeated
  // renders replace the previous button instead of stacking duplicates.
  function renderWithMore(containerEl, itemsHtml, wrapId) {
    var oldWrap = document.getElementById(wrapId);
    if (oldWrap) oldWrap.remove();

    containerEl.innerHTML = itemsHtml.slice(0, PAGE_SIZE).join("");

    if (itemsHtml.length <= PAGE_SIZE) return;

    var wrap = document.createElement("div");
    wrap.id = wrapId;
    wrap.className = "list-more-wrap";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-more-btn";
    btn.textContent = "전체글보기 (" + itemsHtml.length + "개)";
    btn.addEventListener("click", function () {
      containerEl.innerHTML = itemsHtml.join("");
      wrap.remove();
    });

    wrap.appendChild(btn);
    containerEl.insertAdjacentElement("afterend", wrap);
  }

  function getManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch("posts/manifest.json", { cache: "no-store" }).then(function (res) {
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
      projectsManifestPromise = fetch("projects/manifest.json", { cache: "no-store" }).then(function (res) {
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
      '<div class="post-item-meta">' + badge + '<span class="post-item-date">준공 : ' + escapeHtml(project.completedDate) + "</span></div>" +
      '<h2 class="post-item-title"><a href="' + href + '">' + escapeHtml(project.title) + "</a></h2>" +
      '<p class="post-item-excerpt">' + escapeHtml(project.excerpt) + "</p>" +
      "</div>" +
      "</li>"
    );
  }

  function renderProjectCases() {
    if (headingEl) headingEl.textContent = "";
    var oldWrap = document.getElementById("post-list-more-wrap");
    if (oldWrap) oldWrap.remove();
    getProjectsManifest()
      .then(function (projects) {
        if (headingEl) headingEl.textContent = "주택시공프로젝트 (" + projects.length + "개)";
        if (!projects.length) {
          listEl.innerHTML = '<li class="empty-state">아직 등록된 프로젝트가 없습니다.</li>';
          return;
        }
        renderWithMore(listEl, projects.map(projectCardHtml), "post-list-more-wrap");
      })
      .catch(function () {
        var wrap = document.getElementById("post-list-more-wrap");
        if (wrap) wrap.remove();
        listEl.innerHTML = '<li class="empty-state">프로젝트를 불러오지 못했습니다.</li>';
      });
  }

  var appSectionEl = document.querySelector(".app-section");

  function updateAppSection(catSlug) {
    if (!appSectionEl) return;
    if (catSlug) {
      appSectionEl.style.display = "none";
      return;
    }
    appSectionEl.style.display = "";
    var appListEl = appSectionEl.querySelector(".app-list");
    if (!appListEl || appListEl.dataset.loaded) return;
    getProjectsManifest()
      .then(function (projects) {
        if (!projects.length) return;
        renderWithMore(appListEl, projects.map(projectCardHtml), "app-list-more-wrap");
        appListEl.dataset.loaded = "1";
      })
      .catch(function () {});
  }

  function render(catSlug) {
    markActiveCategory(catSlug);
    updateAppSection(catSlug);
    var staleWrap = document.getElementById("post-list-more-wrap");
    if (staleWrap) staleWrap.remove();
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

        var postsHtml = posts.map(function (post) {
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
        });

        renderWithMore(listEl, postsHtml, "post-list-more-wrap");
      })
      .catch(function () {
        var wrap = document.getElementById("post-list-more-wrap");
        if (wrap) wrap.remove();
        listEl.innerHTML = '<li class="empty-state">글 목록을 불러오지 못했습니다.</li>';
      });
  }

  render(currentSlug());

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
