import { clsx } from "clsx";
import { useAtom } from "jotai";
import React from "react";

import IconButton from "../../../../ui/src/components/icon-button";
import Spacer from "../../../../ui/src/components/spacer";
import Typography from "../../../../ui/src/components/typography";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import EditIcon from "~/icons/Edit";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { storyMetadataAtom } from "../../atoms";
import StoryMetadataModal from "../metadata-modal";
import styles from "./metadata-bar.module.scss";

const StoryMetadataBar = (): React.ReactElement | null => {
  const [story, setStory] = use_atom(storyMetadataAtom);
  const should_render = use_media_query(BREAKPOINTS.down("desktop"));

  if (!should_render) {
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
      <StoryMetadataModal setStory={setStory} story={story}>
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
