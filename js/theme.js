(function () {
  var stored = localStorage.getItem("theme");
  if (stored) {
    document.documentElement.setAttribute("data-theme", stored);
  }

  window.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    var label = document.querySelector(".theme-toggle-label");

    function currentIsDark() {
      var attr = document.documentElement.getAttribute("data-theme");
      if (attr) return attr === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function updateLabel() {
      btn.textContent = currentIsDark() ? "☀️" : "🌙";
      if (label) label.textContent = currentIsDark() ? "라이트모드 보기" : "다크모드 보기";
    }

    btn.addEventListener("click", function () {
      var next = currentIsDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateLabel();
    });

    updateLabel();
  });
})();
