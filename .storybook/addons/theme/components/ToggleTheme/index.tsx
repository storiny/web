import React from "react";
import { IconButton } from "@storybook/components";
import Moon from "../icons/Moon";
import Sun from "../icons/Sun";

const ToggleTheme = () => {
  const [isDark, setDark] = React.useState(false);

  const updateMode = () => {
    setDark(!isDark);
  };

  React.useEffect(() => {
    const iframe = document.getElementById(
      "storybook-preview-iframe"
    ) as HTMLIFrameElement;
    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow?.document;

    iframeDocument.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
  }, [isDark]);

  return (
    <IconButton
      key="theme-toggle"
      active={false}
      title={isDark ? "Light theme" : "Dark theme"}
      onClick={updateMode}
    >
      {isDark ? <Sun /> : <Moon />}
    </IconButton>
  );
};

export default ToggleTheme;
