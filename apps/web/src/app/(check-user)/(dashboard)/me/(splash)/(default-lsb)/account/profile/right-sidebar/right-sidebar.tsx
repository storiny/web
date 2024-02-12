import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/grow";
import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

import AvatarSettings from "../avatar-settings";
import styles from "./right-sidebar.module.scss";

const AccountProfileRightSidebar = (): React.ReactElement => (
  <RightSidebar
    className={clsx(css["above-desktop"], styles.x, styles["right-sidebar"])}
  >
    <AvatarSettings />
    {/* Push the footer to the bottom of the viewport */}
    <Grow />
  </RightSidebar>
);

export default AccountProfileRightSidebar;
