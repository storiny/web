"use client";

import { clsx } from "clsx";
import React from "react";

import Link from "../../../../../../../../../../../packages/ui/src/components/link";
import Typography from "../../../../../../../../../../../packages/ui/src/components/typography";

import { RECOMMENDED_SUPPORT_RESOURCES } from "./resources";
import styles from "./right-sidebar.module.scss";

const SuspendedDashboardRightSidebarContent = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.content)}>
    <Typography className={clsx("t-bold", "t-minor")} level={"body2"}>
      Recommended support resources
    </Typography>
    <div className={clsx("flex-col", styles.resources)}>
      {RECOMMENDED_SUPPORT_RESOURCES.map((resource) => (
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
