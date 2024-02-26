"use client";

import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { RECOMMENDED_SUPPORT_RESOURCES } from "./resources";
import styles from "./right-sidebar.module.scss";

const SuspendedDashboardRightSidebarContent = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.content)}>
    <Typography color={"minor"} level={"body2"} weight={"bold"}>
      Recommended support resources
    </Typography>
    <div className={clsx(css["flex-col"], styles.resources)}>
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
