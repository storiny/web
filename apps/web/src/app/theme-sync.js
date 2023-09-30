/* eslint-disable */

(function () {
  try {
    const { theme } = JSON.parse(localStorage.getItem("preferences") || "{}");
    let final_theme = theme || "system";

    if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        final_theme = "dark";
      } else {
        final_theme = "light";
      }
    }

    document.documentElement.setAttribute("data-theme", final_theme);
  } catch {}
})();
