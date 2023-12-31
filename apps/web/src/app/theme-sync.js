/* eslint-disable */

function sync_theme() {
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
}

sync_theme();

if (typeof document !== "undefined") {
  document.onload = sync_theme;
}
