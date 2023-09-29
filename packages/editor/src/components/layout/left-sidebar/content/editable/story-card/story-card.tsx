import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

import AspectRatio from "../../../../../../../../ui/src/components/aspect-ratio";
import Button from "../../../../../../../../ui/src/components/button";
import IconButton from "../../../../../../../../ui/src/components/icon-button";
import Image from "../../../../../../../../ui/src/components/image";
import Typography from "../../../../../../../../ui/src/components/typography";
import EditIcon from "~/icons/Edit";
import ImageIcon from "~/icons/Image";
import PhotoEditIcon from "~/icons/PhotoEdit";

import { docStatusAtom, storyMetadataAtom } from "../../../../../../atoms";
import StoryMetadataModal from "../../../../../metadata-modal";
import styles from "./story-card.module.scss";
import { EditorStoryCardProps } from "./story-card.props";

const EditorStoryCard = (props: EditorStoryCardProps): React.ReactElement => {
  const { className, status, ...rest } = props;
  const [story, setStory] = use_atom(storyMetadataAtom);
  const docStatus = use_atom_value(docStatusAtom);
  const publishing = docStatus === "publishing";

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
          <StoryMetadataModal setStory={setStory} story={story}>
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
            <StoryMetadataModal setStory={setStory} story={story}>
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
