import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import IconButton from "~/components/IconButton";
import Popover from "~/components/Popover";
import Tooltip from "~/components/Tooltip";
import MusicIcon from "~/icons/Music";

import navbarStyles from "../navbar.module.scss";
import styles from "./music-item.module.scss";

const MusicItemContent = dynamic(() => import("./content"));

const MusicItem = (): React.ReactElement => (
  <Popover
    className={clsx("flex-col", styles.x, styles.popover)}
    open
    slotProps={{
      trigger: { "aria-label": "Choose music" }
    }}
    trigger={
      <div className={clsx("flex-center", "full-h")}>
        <Tooltip content={"Music"}>
          <IconButton
            className={clsx(navbarStyles.x, navbarStyles.button)}
            size={"lg"}
            variant={"ghost"}
          >
            <MusicIcon />
          </IconButton>
        </Tooltip>
      </div>
    }
  >
    <MusicItemContent />
  </Popover>
);

export default MusicItem;
