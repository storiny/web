import { ExtensionStyles } from "../base";

const empty_line_gutter_extension_styles: ExtensionStyles = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "&.cm-emptyLines": {
    color: "var(--fg-muted)",
    opacity: 0.45,
    pointerEvents: "none",
    textAlign: "center",
    width: "18px"
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};

const FOLD_ICON = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDkuMThxLS4xNyAwLS4zNC0uMDctLjE2LS4wNi0uMjgtLjE4bC0zLTNxLS4yMy0uMjMtLjIzLS41MyAwLS4zLjIzLS41My4yMi0uMjIuNTItLjIyLjMgMCAuNTMuMjNMMTIgNy40NWwyLjU4LTIuNThxLjIyLS4yMi41Mi0uMjIuMyAwIC41My4yMy4yMi4yMi4yMi41MiAwIC4zLS4yMy41M2wtMyAzcS0uMTIuMTItLjI4LjE4LS4xNy4wNy0uMzQuMDdabS0zLjYzIDkuOTVxLS4yMi0uMjMtLjIyLS41MyAwLS4zLjIzLS41M2wzLTNxLjEyLS4xMi4yOC0uMTguMTctLjA2LjM0LS4wNnQuMzQuMDZxLjE2LjA2LjI4LjE5bDMuMDMgMy4wMnEuMi4yLjIuNXQtLjIzLjUzcS0uMjIuMjItLjUyLjIyLS4zIDAtLjUzLS4yM0wxMiAxNi41NWwtMi41OCAyLjU4cS0uMjIuMjItLjUyLjIyLS4zIDAtLjUzLS4yM1oiLz48L3N2Zz4=")`;
const UNFOLD_ICON = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTguMzggOC4xNXEtLjIzLS4yMy0uMjMtLjU1IDAtLjMyLjIzLS41NWwzLTNxLjEyLS4xMi4yOC0uMTkuMTctLjA2LjM0LS4wNnQuMzQuMDZxLjE2LjA3LjI4LjE5bDMuMDMgMy4wM3EuMjMuMjIuMjEuNTMtLjAxLjMyLS4yMy41NC0uMi4yLS41My4ydC0uNTUtLjJMMTIgNS42IDkuNDUgOC4xNXEtLjIzLjIzLS41NS4yMS0uMzMtLjAxLS41My0uMjFaTTEyIDIwLjI1cS0uMTcgMC0uMzQtLjA2LS4xNi0uMDctLjI4LS4xOWwtMy0zcS0uMjMtLjIzLS4yMy0uNTUgMC0uMzMuMjMtLjUzLjItLjIyLjUyLS4yMnQuNTUuMjNMMTIgMTguNDZsMi41NS0yLjU3cS4yMy0uMjMuNTUtLjIxLjMzLjAxLjUzLjIzLjIyLjIuMjIuNTN0LS4yMi41NWwtMyAzcS0uMTMuMTMtLjMuMTktLjE1LjA2LS4zMy4wNloiLz48L3N2Zz4=")`;

const fold_gutter_extension_styles: ExtensionStyles = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "&.cm-foldGutter": {
    "& .cm-fold-marker": {
      "&:hover": {
        opacity: 0.75
      },
      '&[data-open="false"]': {
        backgroundImage: UNFOLD_ICON
      },
      backgroundImage: FOLD_ICON,
      backgroundPosition: "150% 15%",
      backgroundRepeat: "no-repeat",
      backgroundSize: "110%",
      display: "inline-block",
      height: "16px",
      opacity: 0.35,
      transition: "opacity 100ms ease",
      verticalAlign: "middle",
      width: "12px"
    },
    "& .cm-gutterElement": {
      pointerEvents: "auto"
    },
    pointerEvents: "none",
    position: "absolute",
    right: "2px",
    zIndex: 1
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};

const line_number_gutter_extension_styles: ExtensionStyles = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "& .cm-gutter.cm-lineNumbers": {
    "& .cm-gutterElement": {
      color: "var(--fg-muted)",
      opacity: 0.65
    },
    marginLeft: "6px"
  },
  "&.cm-focused .cm-gutter.cm-lineNumbers": {
    "& .cm-gutterElement": {
      "&.cm-activeLineGutter": {
        color: "var(--fg-major)"
      }
    }
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};

export const gutter_extension_styles: ExtensionStyles = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "& .cm-gutter": {
    "& *": {
      fontFamily: "var(--font-monospace)"
    },
    userSelect: "none",
    ...empty_line_gutter_extension_styles,
    ...fold_gutter_extension_styles
  },
  ...line_number_gutter_extension_styles
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};
