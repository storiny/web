import { ExtensionStyles } from "../base";

export const auto_link_extension_styles: ExtensionStyles = {
  ".cm-link-icon": {
    "& img": {
      display: "block",
      userSelect: "none"
    },
    cursor: "pointer",
    display: "inline-block",
    marginLeft: "0.2ch",
    verticalAlign: "middle"
  }
};
