import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import Button from "../../../../../../ui/src/components/button";
import IconButton from "../../../../../../ui/src/components/icon-button";
import Popover from "../../../../../../ui/src/components/popover";
import Spinner from "../../../../../../ui/src/components/spinner";
import Typography from "../../../../../../ui/src/components/typography";
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
        className={clsx("focus-invert", navbarStyles.x, navbarStyles.button)}
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
