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
      "</div>" +
      "</section>"
    );
  }

  function render(data) {
    document.title = data.title + " · 토리의 주택이야기";

    var conditions = data.conditions
      .map(function (c) {
        return "<li>" + escapeHtml(c) + "</li>";
      })
      .join("");

    var phases = data.phases.map(phaseSection).join("");

    root.innerHTML =
      '<figure class="project-cover">' +
      '<img src="' + data.cover + '" alt="' + escapeHtml(data.title) + '">' +
      "</figure>" +
      '<header class="project-header">' +
      "<h1>" + escapeHtml(data.title) + "</h1>" +
      '<p class="project-specs">' + escapeHtml(data.specs) + "</p>" +
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

    function close() {
      overlay.classList.remove("is-open");
      overlayImg.src = "";
    }

    overlay.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    root.addEventListener("click", function (e) {
      var img = e.target.closest(".phase-photo img, .gallery-item img, .project-cover img");
      if (!img) return;
      overlayImg.src = img.src;
      overlayImg.alt = img.alt || "";
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
