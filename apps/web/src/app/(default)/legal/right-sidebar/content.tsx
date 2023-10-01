"use client";

import { clsx } from "clsx";
import { usePathname as use_pathname } from "next/navigation";
import React from "react";

import Typography from "~/components/typography";

import styles from "./right-sidebar.module.scss";
import Toc from "./toc";

const SuspendedLegalRightSidebarContent = (): React.ReactElement => {
  const pathname = use_pathname();
  return (
    <div className={clsx("flex-col", styles.content)}>
      <Typography className={clsx("t-medium", "t-minor")}>
        In this document
      </Typography>
      {/* Refresh Toc list on route change */}
      <Toc key={pathname} />
    </div>
  );
};

export default SuspendedLegalRightSidebarContent;
