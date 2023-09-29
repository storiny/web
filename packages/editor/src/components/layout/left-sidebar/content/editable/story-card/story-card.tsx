import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import React from "react";

import AspectRatio from "../../../../../../../../ui/src/components/aspect-ratio";
import Button from "../../../../../../../../ui/src/components/button";
import IconButton from "../../../../../../../../ui/src/components/icon-button";
import Image from "../../../../../../../../ui/src/components/image";
import Typography from "../../../../../../../../ui/src/components/typography";
import EditIcon from "../../../../../../../../ui/src/icons/edit";
import ImageIcon from "../../../../../../../../ui/src/icons/image";
import PhotoEditIcon from "../../../../../../../../ui/src/icons/photo-edit";

import { doc_status_atom, story_metadata_atom } from "../../../../../../atoms";
import StoryMetadataModal from "../../../../../metadata-modal";
import styles from "./story-card.module.scss";
import { EditorStoryCardProps } from "./story-card.props";

const EditorStoryCard = (props: EditorStoryCardProps): React.ReactElement => {
  const { className, status, ...rest } = props;
  const [story, set_story] = use_atom(story_metadata_atom);
  const doc_status = use_atom_value(doc_status_atom);
  const publishing = doc_status === "publishing";

  return (
    <article {...rest} className={clsx(styles["story-card"], className)}>
      <AspectRatio className={clsx("full-w", styles.splash)} ratio={1.76}>
        {!story.splash_id ? (
          <div className={clsx("flex-center", styles.placeholder)}>
            <ImageIcon />
          </div>
        ) : (
          <Image
            alt={""}
            hex={story.splash_hex}
            img_key={story.splash_id}
            size={ImageSize.W_320}
          />
        )}
        {status !== "deleted" && (
          <StoryMetadataModal set_story={set_story} story={story}>
            <IconButton
              aria-label={"Set banner"}
              className={clsx("force-light-mode", styles["overlay-button"])}
              disabled={publishing}
              title={"Set banner"}
            >
              <PhotoEditIcon />
            </IconButton>
          </StoryMetadataModal>
        )}
      </AspectRatio>
      <div className={clsx("flex-col", styles.meta)}>
        <Typography className={"t-medium"} level={"body2"} title={story.title}>
          {story.title}
        </Typography>
        {status !== "deleted" && (
          <footer>
            <StoryMetadataModal set_story={set_story} story={story}>
              <Button
                className={"full-w"}
                decorator={<EditIcon />}
                disabled={publishing}
                variant={"hollow"}
              >
                Edit metadata
              </Button>
            </StoryMetadataModal>
          </footer>
        )}
      </div>
    </article>
  );
};

export default EditorStoryCard;
