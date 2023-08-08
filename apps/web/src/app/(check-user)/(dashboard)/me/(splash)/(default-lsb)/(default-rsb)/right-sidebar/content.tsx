"use client";

import { clsx } from "clsx";
import React from "react";

import Link from "~/components/Link";
import Typography from "~/components/Typography";

import { recommendedSupportResources } from "./resources";
import styles from "./right-sidebar.module.scss";

const SuspendedDashboardRightSidebarContent = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles.content)}>
    <Typography className={clsx("t-bold", "t-minor")} level={"body2"}>
      Recommended support resources
    </Typography>
    <div className={clsx("flex-col", styles.x, styles.resources)}>
      {recommendedSupportResources.map((resource) => (
        <Link
          href={resource.href}
          key={resource.href}
          level={"body2"}
          target={"_blank"}
        >
          {resource.title}
        </Link>
      ))}
    </div>
  </div>
);

export default SuspendedDashboardRightSidebarContent;
