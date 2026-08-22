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
      Accept: "application/vnd.github+json"
    };
    if (extra) {
      for (var k in extra) h[k] = extra[k];
    }
    return h;
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
          throw new Error("저장 실패 (" + res.status + "): " + (err.message || res.statusText));
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
    fileToBase64: fileToBase64
  };
})();
