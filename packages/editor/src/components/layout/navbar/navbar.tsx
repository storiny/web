"use client";

import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import Logo from "~/brand/Logo";
import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Menubar from "~/components/Menubar";
import MenubarMenu from "~/components/MenubarMenu";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ChevronIcon from "~/icons/Chevron";
import CloudSyncingIcon from "~/icons/CloudSyncing";
import QuestionMarkIcon from "~/icons/QuestionMark";
import VersionHistoryIcon from "~/icons/VersionHistory";
import { breakpoints } from "~/theme/breakpoints";

import MusicItem from "./music-item";
import styles from "./navbar.module.scss";

const EditorMenubarItems = dynamic(() => import("./menubar-items"), {
  loading: ({ isLoading, error, retry }) =>
    error && !isLoading ? (
      <div className={"flex-center"} style={{ paddingBlock: "32px" }}>
        <Button color={"ruby"} onClick={retry} variant={"hollow"}>
          Retry
        </Button>
      </div>
    ) : (
      <SuspenseLoader />
    )
});

const EditorMenubar = (): React.ReactElement => (
  <Menubar className={"full-h"}>
    <MenubarMenu
      slotProps={{
        content: {
          style: { minWidth: "176px" }
        }
      }}
      trigger={
        <Button
          className={clsx("focus-invert", "flex-center", styles.x, styles.menu)}
          variant={"ghost"}
        >
          <Logo size={26} />
          <span className={clsx(styles.x, styles.chevron)}>
            <ChevronIcon rotation={180} />
          </span>
        </Button>
      }
    >
      <EditorMenubarItems />
    </MenubarMenu>
  </Menubar>
);

const EditorNavbar = (): React.ReactElement => {
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  return (
    <header className={clsx(styles.x, styles["editor-navbar"])} role={"banner"}>
      <div className={clsx("flex-center", styles.x, styles["full-height"])}>
        <EditorMenubar />
        {!isSmallerThanTablet && (
          <React.Fragment>
            <Tooltip content={"Version history"}>
              <IconButton
                className={clsx("focus-invert", styles.x, styles.button)}
                size={"lg"}
                variant={"ghost"}
              >
                <VersionHistoryIcon />
              </IconButton>
            </Tooltip>
            <MusicItem />
            <Tooltip content={"Help"}>
              <IconButton
                as={NextLink}
                className={clsx("focus-invert", styles.x, styles.button)}
                href={"/help"}
                size={"lg"}
                target={"_blank"}
                variant={"ghost"}
              >
                <QuestionMarkIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        )}
      </div>
      <Spacer className={"f-grow"} size={2} />
      <div className={clsx("flex-center")}>
        <Tooltip content={"Syncing…"}>
          <span
            className={clsx("flex-center", styles.x, styles["status-icon"])}
          >
            <CloudSyncingIcon />
          </span>
        </Tooltip>
        <Spacer size={2} />
        <Button variant={"hollow"}>Share</Button>
        <Spacer />
        <Button>Publish</Button>
      </div>
    </header>
  );
};

export default EditorNavbar;
