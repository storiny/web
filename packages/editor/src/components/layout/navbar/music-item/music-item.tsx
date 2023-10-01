import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Popover from "~/components/popover";
import Spinner from "~/components/spinner";
import Typography from "~/components/typography";
import MusicIcon from "~/icons/music";

import navbar_styles from "../navbar.module.scss";
import styles from "./music-item.module.scss";

const MusicItemContent = dynamic(() => import("./content"), {
  ssr: false,
  loading: ({ isLoading: is_loading, error, retry }) =>
    error && !is_loading ? (
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

const MusicItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <Popover
    className={clsx("flex-col", "flex-center", styles.x, styles.popover)}
    slot_props={{
      trigger: { "aria-label": "Choose music" }
    }}
    trigger={
      // TODO: Add tooltip once `data-state` clash resolves
      <IconButton
        aria-label={"Music"}
        className={clsx("focus-invert", navbar_styles.x, navbar_styles.button)}
        disabled={disabled}
        size={"lg"}
        title={"Music"}
        variant={"ghost"}
      >
        <MusicIcon />
      </IconButton>
    }
  >
    <MusicItemContent />
  </Popover>
);

export default MusicItem;
