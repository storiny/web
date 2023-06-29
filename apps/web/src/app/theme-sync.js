/* eslint-disable */

(function () {
  try {
    const { theme } = JSON.parse(localStorage.getItem("preferences") || "{}");
    let finalTheme = theme || "system";

    if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        finalTheme = "dark";
      } else {
        finalTheme = "light";
      }
    }

    document.documentElement.setAttribute("data-theme", finalTheme);
  } catch (e) {}
})();
