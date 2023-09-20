import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Typography from "~/components/Typography";
import EditIcon from "~/icons/Edit";
import ImageIcon from "~/icons/Image";
import PhotoEditIcon from "~/icons/PhotoEdit";

import { storyMetadataAtom } from "../../../../../atoms";
import StoryMetadataModal from "../../../../metadata-modal";
import styles from "./story-card.module.scss";
import { EditorStoryCardProps } from "./story-card.props";

const EditorStoryCard = (props: EditorStoryCardProps): React.ReactElement => {
  const { className, ...rest } = props;
  const story = useAtomValue(storyMetadataAtom);

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
            imgId={story.splash_id}
            size={ImageSize.W_320}
          />
        )}
        <StoryMetadataModal story={story}>
          <IconButton
            aria-label={"Set banner"}
            className={clsx("force-light-mode", styles["overlay-button"])}
            title={"Set banner"}
          >
            <PhotoEditIcon />
          </IconButton>
        </StoryMetadataModal>
      </AspectRatio>
      <div className={clsx("flex-col", styles.meta)}>
        <Typography className={"t-medium"} level={"body2"} title={story.title}>
          {story.title}
        </Typography>
        <footer>
          <StoryMetadataModal story={story}>
            <Button
              className={"full-w"}
              decorator={<EditIcon />}
              variant={"hollow"}
            >
              Edit metadata
            </Button>
          </StoryMetadataModal>
        </footer>
      </div>
    </article>
  );
};

export default EditorStoryCard;
