import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/grow";
import Typography from "~/components/typography";
import RightSidebar from "~/layout/right-sidebar";
import css from "~/theme/main.module.scss";

import LogoSettings from "../logo-settings";
import styles from "./right-sidebar.module.scss";

const BlogGeneralSettingsRightSidebar = (): React.ReactElement => (
  <RightSidebar
    className={clsx(css["above-desktop"], styles.x, styles["right-sidebar"])}
  >
    <Typography as={"span"} color={"minor"} level={"body2"} weight={"bold"}>
      Blog logo
    </Typography>
    <LogoSettings />
    {/* Push the footer to the bottom of the viewport */}
    <Grow />
  </RightSidebar>
);

export default BlogGeneralSettingsRightSidebar;
