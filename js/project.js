(function () {
  var root = document.getElementById("project-root");

  function slugFromQuery() {
    return new URLSearchParams(window.location.search).get("slug") || "";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function phaseSection(phase, index) {
    var captions = phase.captions;
    var grid = phase.images
      .map(function (src, i) {
        var cap = captions ? '<span class="phase-photo-caption">' + escapeHtml(captions[i] || "") + "</span>" : "";
        return (
          '<figure class="phase-photo">' +
          '<img src="' + src + '" alt="' + escapeHtml(phase.label) + '" loading="lazy">' +
          cap +
          "</figure>"
        );
      })
      .join("");

    return (
      '<section class="phase">' +
      '<div class="phase-marker"><span class="phase-num">' + String(index + 1).padStart(2, "0") + "</span></div>" +
      '<div class="phase-body">' +
      '<h2 class="phase-title">' + escapeHtml(phase.label) + "</h2>" +
      '<div class="phase-grid">' + grid + "</div>" +
      '<p class="phase-desc"><strong>' + escapeHtml(phase.label) + "</strong> &mdash; " + escapeHtml(phase.desc) + "</p>" +
      "</div>" +
      "</section>"
    );
  }

  function gallerySection(gallery) {
    var imgs = gallery.images
      .map(function (src) {
        return '<div class="gallery-item"><img src="' + src + '" alt="' + escapeHtml(gallery.label) + '" loading="lazy"></div>';
      })
      .join("");
    return (
      '<section class="phase gallery-section">' +
      '<div class="phase-marker"><span class="phase-num">★</span></div>' +
      '<div class="phase-body">' +
      '<h2 class="phase-title">' + escapeHtml(gallery.label) + "</h2>" +
      '<div class="gallery-grid">' + imgs + "</div>" +
      (gallery.desc ? '<p class="phase-desc"><strong>' + escapeHtml(gallery.label) + "</strong> &mdash; " + escapeHtml(gallery.desc) + "</p>" : "") +
      "</div>" +
      "</section>"
    );
  }

  function updateMeta(data) {
    var imageUrl = "https://toryhome.kr/" + data.cover;
    var pageUrl = "https://toryhome.kr/project.html?slug=" + encodeURIComponent(data.slug);
    var desc = data.intro ? data.intro.slice(0, 120) + (data.intro.length > 120 ? "..." : "") : "";
    setMeta("meta-description", desc);
    setMeta("meta-og-title", data.title + " · 토리의 주택이야기");
    setMeta("meta-og-description", desc);
    setMeta("meta-og-image", imageUrl);
    setMeta("meta-og-url", pageUrl);
  }

  function setMeta(id, value) {
    var el = document.getElementById(id);
    if (el) el.setAttribute("content", value);
  }

  function render(data) {
    document.title = data.title + " · 토리의 주택이야기";
    updateMeta(data);

    var conditions = data.conditions
      .map(function (c) {
        return "<li>" + escapeHtml(c) + "</li>";
      })
      .join("");

    var phases = data.phases.map(phaseSection).join("");

    var specs = data.specs
      .map(function (s) {
        return (
          '<div class="spec-row">' +
          '<span class="spec-label">' + escapeHtml(s.label) + "</span>" +
          '<span class="spec-colon">:</span>' +
          '<span class="spec-value">' + escapeHtml(s.value) + "</span>" +
          "</div>"
        );
      })
      .join("");

    root.innerHTML =
      '<figure class="project-cover">' +
      '<img src="' + data.cover + '" alt="' + escapeHtml(data.title) + '">' +
      "</figure>" +
      '<header class="project-header">' +
      "<h1>" + escapeHtml(data.title) + "</h1>" +
      '<div class="project-specs">' + specs + "</div>" +
      "</header>" +
      '<section class="project-intro">' +
      "<p>" + escapeHtml(data.intro) + "</p>" +
      '<h3 class="conditions-title">건축주의 조건</h3>' +
      '<ol class="conditions-list">' + conditions + "</ol>" +
      "</section>" +
      '<div class="phase-list">' + phases + gallerySection(data.gallery) + "</div>";
  }

  function setupLightbox() {
    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.innerHTML = '<button type="button" class="lightbox-close" aria-label="닫기">&times;</button><img alt="">';
    document.body.appendChild(overlay);
    var overlayImg = overlay.querySelector("img");

    var group = [];
    var currentIndex = -1;

    function show(index) {
      if (!group.length) return;
      currentIndex = (index + group.length) % group.length;
      var img = group[currentIndex];
      overlayImg.src = img.src;
      overlayImg.alt = img.alt || "";
    }

    function close() {
      overlay.classList.remove("is-open");
      overlayImg.src = "";
      group = [];
      currentIndex = -1;
    }

    overlay.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(currentIndex + 1);
      else if (e.key === "ArrowLeft") show(currentIndex - 1);
    });

    root.addEventListener("click", function (e) {
      var img = e.target.closest(".phase-photo img, .gallery-item img, .project-cover img");
      if (!img) return;
      var container = img.closest(".phase-grid, .gallery-grid");
      group = container ? Array.prototype.slice.call(container.querySelectorAll("img")) : [img];
      currentIndex = group.indexOf(img);
      show(currentIndex);
      overlay.classList.add("is-open");
    });
  }

  setupLightbox();

  var slug = slugFromQuery();
  if (!slug) {
    root.innerHTML = '<p class="empty-state">프로젝트를 찾을 수 없습니다.</p>';
    return;
  }

  fetch("projects/" + encodeURIComponent(slug) + ".json")
    .then(function (res) {
      if (!res.ok) throw new Error("not found");
      return res.json();
    })
    .then(render)
    .catch(function () {
      root.innerHTML = '<p class="empty-state">프로젝트를 불러오지 못했습니다.</p>';
    });
})();
