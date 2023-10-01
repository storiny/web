import React from "react";
import { IconButton } from "@storybook/components";
import Moon from "../icons/Moon";
import Sun from "../icons/Sun";

const ToggleTheme = () => {
  const [is_dark, set_dark] = React.useState(false);

  const updateMode = () => {
    set_dark((prev_state) => !prev_state);
  };

  React.useEffect(() => {
    const iframe = document.getElementById(
      "storybook-preview-iframe"
    ) as HTMLIFrameElement;
    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow?.document;

    iframeDocument?.documentElement.setAttribute(
      "data-theme",
      is_dark ? "dark" : "light"
    );
  }, [is_dark]);

  return (
    <IconButton
      key="theme-toggle"
      active={false}
      title={is_dark ? "Light theme" : "Dark theme"}
      onClick={updateMode}
    >
      {is_dark ? <Sun /> : <Moon />}
    </IconButton>
  );
};

export default ToggleTheme;
