"use client";

import { clsx } from "clsx";
import { usePathname as use_pathname } from "next/navigation";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./right-sidebar.module.scss";
import Toc from "./toc";

const SuspendedLegalRightSidebarContent = (): React.ReactElement => {
  const pathname = use_pathname();
  return (
    <div className={clsx(css["flex-col"], styles.content)}>
      <Typography className={clsx(css["t-medium"], css["t-minor"])}>
        In this document
      </Typography>
      {/* Refresh Toc list on route change */}
      <Toc key={pathname} />
    </div>
  );
};

export default SuspendedLegalRightSidebarContent;
