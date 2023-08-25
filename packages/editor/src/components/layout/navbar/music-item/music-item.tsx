import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Popover from "~/components/Popover";
import Spinner from "~/components/Spinner";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import MusicIcon from "~/icons/Music";

import navbarStyles from "../navbar.module.scss";
import styles from "./music-item.module.scss";

const MusicItemContent = dynamic(() => import("./content"), {
  ssr: false,
  loading: ({ isLoading, error, retry }) =>
    error && !isLoading ? (
      <React.Fragment>
        <Typography className={"t-minor"} level={"body2"}>
          Unable to load the player
        </Typography>
        <Button
          className={"fit-w"}
          color={"ruby"}
          onClick={retry}
          size={"sm"}
          variant={"hollow"}
        >
          Retry
        </Button>
      </React.Fragment>
    ) : (
      <Spinner />
    )
});

const MusicItem = (): React.ReactElement => (
  <Popover
    className={clsx("flex-col", "flex-center", styles.x, styles.popover)}
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
