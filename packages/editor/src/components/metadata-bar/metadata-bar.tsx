import { clsx } from "clsx";
import { useAtom as use_atom } from "jotai";
import React from "react";

import IconButton from "~/components/icon-button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import EditIcon from "~/icons/edit";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import { story_metadata_atom } from "../../atoms";
import StoryMetadataModal from "../metadata-modal";
import styles from "./metadata-bar.module.scss";

const StoryMetadataBar = (): React.ReactElement | null => {
  const [story, set_story] = use_atom(story_metadata_atom);
  const should_render = use_media_query(BREAKPOINTS.down("desktop"));

  if (!should_render) {
    return null;
  }

  return (
    <div
      className={clsx(
        css["flex-center"],
        css["page-header"],
        styles["metadata-bar"]
      )}
    >
      <Typography as={"p"} ellipsis level={"h6"} style={{ width: "100%" }}>
        {story.title}
      </Typography>
      <Spacer className={css["f-grow"]} />
      {story.is_writer && (
        <StoryMetadataModal set_story={set_story} story={story}>
          <IconButton
            aria-label={"Edit metadata"}
            size={"lg"}
            title={"Edit metadata"}
            variant={"ghost"}
          >
            <EditIcon />
          </IconButton>
        </StoryMetadataModal>
      )}
    </div>
  );
};

export default StoryMetadataBar;
