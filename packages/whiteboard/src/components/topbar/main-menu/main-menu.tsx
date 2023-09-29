import clsx from "clsx";
import React from "react";

import IconButton from "../../../../../ui/src/components/icon-button";
import Menu from "../../../../../ui/src/components/menu";
import Separator from "../../../../../ui/src/components/separator";
import MenuIcon from "../../../../../ui/src/icons/menu";

import styles from "../topbar.module.scss";
import ExportImageItem from "./export-image-item";
import ImportItem from "./import-item";
import LocalCopyItem from "./local-copy-item";
import ResetCanvasItem from "./reset-canvas-item";

const MainMenu = (): React.ReactElement => (
  <Menu
    size={"sm"}
    slot_props={{
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
