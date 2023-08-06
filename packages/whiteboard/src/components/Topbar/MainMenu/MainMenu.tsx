import clsx from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import Separator from "~/components/Separator";
import MenuIcon from "~/icons/Menu";

import styles from "../Topbar.module.scss";
import ExportImageItem from "./ExportImageItem";
import ImportItem from "./ImportItem";
import LocalCopyItem from "./LocalCopyItem";
import ResetCanvasItem from "./ResetCanvasItem";

const MainMenu = (): React.ReactElement => (
  <Menu
    size={"sm"}
    slotProps={{
      content: {
        style: {
          zIndex: "calc(var(--z-index-modal) + 2)"
        }
      }
    }}
    trigger={
      <IconButton
        aria-label={"Main menu"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        variant={"ghost"}
      >
        <MenuIcon />
      </IconButton>
    }
  >
    <ImportItem />
    <LocalCopyItem />
    <ExportImageItem />
    <Separator />
    <ResetCanvasItem />
  </Menu>
);

export default MainMenu;
