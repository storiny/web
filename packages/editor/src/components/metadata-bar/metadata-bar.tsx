import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import IconButton from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import EditIcon from "~/icons/Edit";
import { breakpoints } from "~/theme/breakpoints";

import { storyMetadataAtom } from "../../atoms";
import StoryMetadataModal from "../metadata-modal";
import styles from "./metadata-bar.module.scss";

const StoryMetadataBar = (): React.ReactElement | null => {
  const story = useAtomValue(storyMetadataAtom);
  const shouldRender = useMediaQuery(breakpoints.down("desktop"));

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={clsx(
        "flex-center",
        "page-header",
        styles.x,
        styles["metadata-bar"]
      )}
    >
      <Typography as={"p"} ellipsis level={"h6"}>
        {story.title}
      </Typography>
      <Spacer className={"f-grow"} />
      <StoryMetadataModal story={story}>
        <IconButton
          aria-label={"Edit metadata"}
          size={"lg"}
          title={"Edit metadata"}
          variant={"ghost"}
        >
          <EditIcon />
        </IconButton>
      </StoryMetadataModal>
    </div>
  );
};

export default StoryMetadataBar;
