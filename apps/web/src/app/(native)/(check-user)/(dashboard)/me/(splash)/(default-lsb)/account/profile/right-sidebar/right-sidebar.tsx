import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/grow";
import { use_media_query } from "~/hooks/use-media-query";
import RightSidebar from "~/layout/right-sidebar";
import { BREAKPOINTS } from "~/theme/breakpoints";

import AvatarSettings from "../avatar-settings";
import styles from "./right-sidebar.module.scss";

const AccountProfileRightSidebar = (): React.ReactElement | null => {
  const should_render = use_media_query(BREAKPOINTS.up("desktop"));

  if (!should_render) {
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
