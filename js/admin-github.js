(function () {
  var OWNER = "tory0428-sudal";
  var REPO = "myblog";
  var BRANCH = "main";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";
  var RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/" + BRANCH + "/";

  function getToken() {
    return localStorage.getItem("admin_pat") || "";
  }
  function setToken(t) {
    localStorage.setItem("admin_pat", t);
  }
  function clearToken() {
    localStorage.removeItem("admin_pat");
  }

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function base64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
  }

  function authHeaders(extra) {
    var h = {
      Authorization: "token " + getToken(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (extra) {
      for (var k in extra) h[k] = extra[k];
    }
    return h;
  }

  // Turn a raw GitHub API failure into a clear, actionable Korean message.
  function friendlyError(status, apiMessage) {
    if (status === 401) {
      return "토큰이 만료되었거나 올바르지 않습니다. GitHub에서 토큰을 새로 발급해 다시 로그인하세요.";
    }
    if (status === 403 || status === 404) {
      return "이 토큰에는 저장소 쓰기 권한이 없습니다.\n" +
        "GitHub 토큰 설정에서 Repository access는 이 저장소(myblog), " +
        "Repository permissions의 Contents를 \"Read and write\"로 설정해 토큰을 다시 발급한 뒤, " +
        "로그아웃하고 새 토큰으로 다시 로그인하세요.";
    }
    if (status === 409) {
      return "그 사이 파일이 다른 곳에서 수정됐습니다. 페이지를 새로고침한 뒤 다시 저장하세요.";
    }
    if (status === 422) {
      return "저장 요청이 거부됐습니다(파일 정보 불일치). 페이지를 새로고침한 뒤 다시 시도하세요.";
    }
    return "저장 실패 (" + status + "): " + (apiMessage || "알 수 없는 오류");
  }

  // Check up front whether the current token can actually write to this repo,
  // so the user finds out at login instead of at save time.
  function verifyAccess() {
    return fetch("https://api.github.com/repos/" + OWNER + "/" + REPO, {
      headers: authHeaders()
    }).then(function (res) {
      if (res.status === 401) return { ok: false, reason: "invalid" };
      if (res.status === 403 || res.status === 404) return { ok: false, reason: "no-repo" };
      if (!res.ok) return { ok: false, reason: "http", status: res.status };
      return res.json().then(function (data) {
        var p = data.permissions || {};
        if (p.push || p.maintain || p.admin) return { ok: true };
        return { ok: false, reason: "readonly" };
      });
    }).catch(function () {
      return { ok: false, reason: "network" };
    });
  }

  function ghGet(path) {
    return fetch(API + path, { headers: authHeaders() }).then(function (res) {
      if (!res.ok) throw new Error("불러오기 실패 (" + res.status + "): " + path);
      return res.json();
    });
  }

  function ghPut(path, base64Content, sha, message) {
    return fetch(API + path, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        message: message,
        content: base64Content,
        sha: sha,
        branch: BRANCH
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (err) {
          throw new Error(friendlyError(res.status, err.message || res.statusText));
        });
      }
      return res.json();
    });
  }

  function ghPutText(path, text, sha, message) {
    return ghPut(path, utf8ToBase64(text), sha, message);
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.AdminGH = {
    RAW: RAW,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    ghGet: ghGet,
    ghPut: ghPut,
    ghPutText: ghPutText,
    base64ToUtf8: base64ToUtf8,
    fileToBase64: fileToBase64,
    verifyAccess: verifyAccess,
    friendlyError: friendlyError
  };
})();
