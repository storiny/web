import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RightSidebar from "~/layout/RightSidebar";
import { breakpoints } from "~/theme/breakpoints";

import AvatarSettings from "../avatar-settings";
import styles from "./right-sidebar.module.scss";

const AccountProfileRightSidebar = (): React.ReactElement | null => {
  const shouldRender = useMediaQuery(breakpoints.up("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      <AvatarSettings />
      {/* Push the footer to the bottom of the viewport */}
      <Grow />
    </RightSidebar>
  );
};

export default AccountProfileRightSidebar;
