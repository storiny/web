/* eslint-disable */

(function () {
  try {
    let theme = localStorage.getItem("theme") || "system";

    if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        theme = "dark";
      } else {
        theme = "light";
      }
    }

    document.documentElement.setAttribute("data-theme", theme);
  } catch {}
})();
