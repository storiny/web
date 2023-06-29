import React from "react";

// Critical styles to prevent dark mode flicker
const CriticalStyles = (): React.ReactElement => (
  <>
    <style
      dangerouslySetInnerHTML={{
        __html: [
          ":root, .force-light-mode {",
          /* */ "--bg-body: hsl(0deg 0% 98%);",
          "}",
          "@media not print {",
          /* */ "html[data-theme=dark], .force-dark-mode {",
          /*   */ "--bg-body: hsl(214deg 8% 10%);",
          /* */ "}",
          "}",
          "html, body {",
          /* */ "background-color: var(--bg-body);",
          "}",
        ].join(""),
      }}
      media={"screen"}
    />
    <style
      dangerouslySetInnerHTML={{
        __html: [
          "body {",
          /* */ "background-color: hsl(0deg 0% 100%) !important;",
          "}",
        ].join(""),
      }}
      media={"print"}
    />
  </>
);

export default CriticalStyles;
