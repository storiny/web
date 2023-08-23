"use client";

import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Logo from "~/brand/Logo";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/Button";
import Menubar from "~/components/Menubar";
import MenubarMenu from "~/components/MenubarMenu";
import Spacer from "~/components/Spacer";
import ChevronIcon from "~/icons/Chevron";
import { selectUser } from "~/redux/features/auth/selectors";
import { useAppSelector } from "~/redux/hooks";

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
  <Menubar>
    <MenubarMenu
      slotProps={{
        content: {
          style: { minWidth: "176px" }
        }
      }}
      trigger={
        <Button
          className={clsx("flex-center", styles.x, styles.menu)}
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
  const user = useAppSelector(selectUser)!;
  return (
    <header className={clsx(styles.x, styles["editor-navbar"])} role={"banner"}>
      <div className={clsx("flex-center", styles.x, styles["full-height"])}>
        <EditorMenubar />
      </div>
      <Spacer className={"f-grow"} size={2} />
      <div className={clsx("flex-center")}>
        <Button variant={"hollow"}>Share</Button>
        <Spacer />
        <Button>Publish</Button>
      </div>
    </header>
  );
};

export default EditorNavbar;
