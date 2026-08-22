(function () {
  var GH = window.AdminGH;

  // ---------- token gate ----------
  var gate = document.getElementById("admin-gate");
  var app = document.getElementById("admin-app");
  var tokenInput = document.getElementById("admin-token-input");
  var logoutBtn = document.getElementById("admin-logout");

  function showApp() {
    gate.hidden = true;
    app.hidden = false;
    initPosts();
    initProjects();
    initCategories();
  }

  document.getElementById("admin-login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = tokenInput.value.trim();
    if (!v) return;
    GH.setToken(v);
    showApp();
  });

  logoutBtn.addEventListener("click", function () {
    GH.clearToken();
    location.reload();
  });

  if (GH.getToken()) {
    showApp();
  }

  // ---------- tabs ----------
  var tabButtons = document.querySelectorAll(".admin-tab-btn");
  var panels = document.querySelectorAll(".admin-panel");
  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabButtons.forEach(function (b) { b.classList.remove("active"); });
      panels.forEach(function (p) { p.hidden = true; });
      btn.classList.add("active");
      document.getElementById(btn.dataset.panel).hidden = false;
    });
  });

  // ---------- helpers ----------
  function extractImagePaths(markdown) {
    var re = /!\[[^\]]*\]\(([^)\s]+)\)/g;
    var paths = [];
    var m;
    while ((m = re.exec(markdown))) {
      if (paths.indexOf(m[1]) === -1) paths.push(m[1]);
    }
    return paths;
  }

  function renderImageReplacer(container, path) {
    var wrap = document.createElement("div");
    wrap.className = "img-replacer";

    var thumb = document.createElement("img");
    thumb.src = GH.RAW + path + "?t=" + Date.now();
    thumb.className = "img-replacer-thumb";
    thumb.alt = "";

    var meta = document.createElement("div");
    meta.className = "img-replacer-meta";

    var pathLabel = document.createElement("code");
    pathLabel.className = "img-replacer-path";
    pathLabel.textContent = path;

    var controls = document.createElement("div");
    controls.className = "img-replacer-controls";

    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "교체";
    btn.className = "btn-small";

    var status = document.createElement("span");
    status.className = "img-replacer-status";

    btn.addEventListener("click", function () {
      if (!input.files[0]) {
        status.textContent = "파일을 선택하세요";
        return;
      }
      btn.disabled = true;
      status.textContent = "업로드 중...";
      GH.ghGet(path)
        .then(function (fileMeta) {
          return GH.fileToBase64(input.files[0]).then(function (b64) {
            return GH.ghPut(path, b64, fileMeta.sha, "관리자 페이지: " + path + " 이미지 교체");
          });
        })
        .then(function () {
          thumb.src = GH.RAW + path + "?t=" + Date.now();
          status.textContent = "완료!";
          input.value = "";
        })
        .catch(function (err) {
          status.textContent = "실패: " + err.message;
        })
        .finally(function () {
          btn.disabled = false;
        });
    });

    controls.append(input, btn, status);
    meta.append(pathLabel, controls);
    wrap.append(thumb, meta);
    container.appendChild(wrap);
  }

  function setStatus(el, text, isError) {
    el.textContent = text;
    el.style.color = isError ? "#c0392b" : "var(--accent)";
  }

  // ---------- posts ----------
  function initPosts() {
    var select = document.getElementById("post-select");
    var editorWrap = document.getElementById("post-editor");
    var textarea = document.getElementById("post-body");
    var imagesWrap = document.getElementById("post-images");
    var saveBtn = document.getElementById("post-save");
    var statusEl = document.getElementById("post-status");
    var currentPath = null;
    var currentSha = null;

    GH.ghGet("posts/manifest.json").then(function (res) {
      var manifest = JSON.parse(GH.base64ToUtf8(res.content));
      manifest.forEach(function (post) {
        var opt = document.createElement("option");
        opt.value = post.slug;
        opt.textContent = post.title;
        select.appendChild(opt);
      });
    }).catch(function (err) {
      setStatus(statusEl, "글 목록 불러오기 실패: " + err.message, true);
    });

    select.addEventListener("change", function () {
      if (!select.value) {
        editorWrap.hidden = true;
        return;
      }
      currentPath = "posts/" + select.value + ".md";
      setStatus(statusEl, "불러오는 중...");
      GH.ghGet(currentPath).then(function (res) {
        currentSha = res.sha;
        var text = GH.base64ToUtf8(res.content);
        textarea.value = text;
        imagesWrap.innerHTML = "";
        extractImagePaths(text).forEach(function (p) {
          renderImageReplacer(imagesWrap, p);
        });
        editorWrap.hidden = false;
        setStatus(statusEl, "");
      }).catch(function (err) {
        setStatus(statusEl, "불러오기 실패: " + err.message, true);
      });
    });

    saveBtn.addEventListener("click", function () {
      if (!currentPath) return;
      saveBtn.disabled = true;
      setStatus(statusEl, "저장 중...");
      GH.ghPutText(currentPath, textarea.value, currentSha, "관리자 페이지: " + select.value + " 본문 수정")
        .then(function (res) {
          currentSha = res.content.sha;
          setStatus(statusEl, "저장 완료! 1~3분 후 사이트에 반영됩니다.");
        })
        .catch(function (err) {
          setStatus(statusEl, "저장 실패: " + err.message, true);
        })
        .finally(function () {
          saveBtn.disabled = false;
        });
    });
  }

  // ---------- projects ----------
  function initProjects() {
    var select = document.getElementById("project-select");
    var editorWrap = document.getElementById("project-editor");
    var introTextarea = document.getElementById("project-intro");
    var specsWrap = document.getElementById("project-specs");
    var imagesWrap = document.getElementById("project-images");
    var saveBtn = document.getElementById("project-save");
    var statusEl = document.getElementById("project-status");
    var currentPath = null;
    var currentSha = null;
    var currentData = null;

    GH.ghGet("projects/manifest.json").then(function (res) {
      var manifest = JSON.parse(GH.base64ToUtf8(res.content));
      manifest.forEach(function (proj) {
        var opt = document.createElement("option");
        opt.value = proj.slug;
        opt.textContent = proj.title;
        select.appendChild(opt);
      });
    }).catch(function (err) {
      setStatus(statusEl, "프로젝트 목록 불러오기 실패: " + err.message, true);
    });

    select.addEventListener("change", function () {
      if (!select.value) {
        editorWrap.hidden = true;
        return;
      }
      currentPath = "projects/" + select.value + ".json";
      setStatus(statusEl, "불러오는 중...");
      GH.ghGet(currentPath).then(function (res) {
        currentSha = res.sha;
        currentData = JSON.parse(GH.base64ToUtf8(res.content));

        introTextarea.value = currentData.intro || "";

        specsWrap.innerHTML = "";
        (currentData.specs || []).forEach(function (spec, i) {
          var row = document.createElement("div");
          row.className = "spec-edit-row";

          var labelInput = document.createElement("input");
          labelInput.type = "text";
          labelInput.value = spec.label;
          labelInput.dataset.specIndex = i;
          labelInput.dataset.specField = "label";
          labelInput.className = "spec-edit-label";

          var valueInput = document.createElement("input");
          valueInput.type = "text";
          valueInput.value = spec.value;
          valueInput.dataset.specIndex = i;
          valueInput.dataset.specField = "value";
          valueInput.className = "spec-edit-value";

          row.append(labelInput, valueInput);
          specsWrap.appendChild(row);
        });

        imagesWrap.innerHTML = "";

        var coverGroup = document.createElement("div");
        coverGroup.className = "image-group";
        var coverTitle = document.createElement("h4");
        coverTitle.textContent = "대표 사진";
        coverGroup.appendChild(coverTitle);
        renderImageReplacer(coverGroup, currentData.cover);
        imagesWrap.appendChild(coverGroup);

        (currentData.phases || []).forEach(function (phase) {
          var details = document.createElement("details");
          details.className = "image-group-collapsible";
          var summary = document.createElement("summary");
          summary.textContent = phase.label + " (" + (phase.images || []).length + "장)";
          details.appendChild(summary);
          var grid = document.createElement("div");
          grid.className = "image-grid";
          (phase.images || []).forEach(function (p) {
            renderImageReplacer(grid, p);
          });
          details.appendChild(grid);
          imagesWrap.appendChild(details);
        });

        if (currentData.gallery) {
          var details = document.createElement("details");
          details.className = "image-group-collapsible";
          var summary = document.createElement("summary");
          summary.textContent = (currentData.gallery.label || "완성 갤러리") + " (" + (currentData.gallery.images || []).length + "장)";
          details.appendChild(summary);
          var grid = document.createElement("div");
          grid.className = "image-grid";
          (currentData.gallery.images || []).forEach(function (p) {
            renderImageReplacer(grid, p);
          });
          details.appendChild(grid);
          imagesWrap.appendChild(details);
        }

        editorWrap.hidden = false;
        setStatus(statusEl, "");
      }).catch(function (err) {
        setStatus(statusEl, "불러오기 실패: " + err.message, true);
      });
    });

    saveBtn.addEventListener("click", function () {
      if (!currentPath || !currentData) return;
      currentData.intro = introTextarea.value;
      var inputs = specsWrap.querySelectorAll("input");
      inputs.forEach(function (inp) {
        var i = Number(inp.dataset.specIndex);
        var field = inp.dataset.specField;
        currentData.specs[i][field] = inp.value;
      });
      var text = JSON.stringify(currentData, null, 2) + "\n";
      saveBtn.disabled = true;
      setStatus(statusEl, "저장 중...");
      GH.ghPutText(currentPath, text, currentSha, "관리자 페이지: " + select.value + " 소개글/스펙 수정")
        .then(function (res) {
          currentSha = res.content.sha;
          setStatus(statusEl, "저장 완료! 1~3분 후 사이트에 반영됩니다.");
        })
        .catch(function (err) {
          setStatus(statusEl, "저장 실패: " + err.message, true);
        })
        .finally(function () {
          saveBtn.disabled = false;
        });
    });
  }

  // ---------- categories ----------
  function initCategories() {
    var listWrap = document.getElementById("category-list");
    var statusEl = document.getElementById("category-status");
    var currentSha = null;
    var currentText = null;

    GH.ghGet("js/categories.js").then(function (res) {
      currentSha = res.sha;
      currentText = GH.base64ToUtf8(res.content);

      var blockRe = /slug:\s*"([^"]+)"[\s\S]*?label:\s*"([^"]*)"[\s\S]*?desc:\s*"([^"]*)"[\s\S]*?image:\s*"([^"]*)"/g;
      var m;
      while ((m = blockRe.exec(currentText))) {
        (function (slug, label, desc, image) {
          var card = document.createElement("div");
          card.className = "category-edit-card";

          var title = document.createElement("h4");
          title.textContent = label;
          card.appendChild(title);

          renderImageReplacer(card, image);

          var textarea = document.createElement("textarea");
          textarea.className = "category-edit-desc";
          textarea.rows = 3;
          textarea.value = desc;

          var saveBtn = document.createElement("button");
          saveBtn.type = "button";
          saveBtn.textContent = "설명 저장";
          saveBtn.className = "btn-small";

          var cardStatus = document.createElement("span");
          cardStatus.className = "img-replacer-status";

          saveBtn.addEventListener("click", function () {
            var newDesc = textarea.value;
            var escaped = newDesc.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
            var perBlockRe = new RegExp('(slug:\\s*"' + slug + '"[\\s\\S]*?desc:\\s*")([^"]*)(")');
            if (!perBlockRe.test(currentText)) {
              setStatus(cardStatus, "카테고리를 찾을 수 없음", true);
              return;
            }
            var updatedText = currentText.replace(perBlockRe, function (match, pre, _old, post) {
              return pre + escaped + post;
            });
            saveBtn.disabled = true;
            setStatus(cardStatus, "저장 중...");
            GH.ghPutText("js/categories.js", updatedText, currentSha, "관리자 페이지: " + slug + " 카테고리 설명 수정")
              .then(function (res) {
                currentText = updatedText;
                currentSha = res.content.sha;
                setStatus(cardStatus, "저장 완료!");
              })
              .catch(function (err) {
                setStatus(cardStatus, "실패: " + err.message, true);
              })
              .finally(function () {
                saveBtn.disabled = false;
              });
          });

          card.append(textarea, saveBtn, cardStatus);
          listWrap.appendChild(card);
        })(m[1], m[2], m[3], m[4]);
      }
    }).catch(function (err) {
      setStatus(statusEl, "카테고리 불러오기 실패: " + err.message, true);
    });
  }
})();
