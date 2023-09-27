import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  LICENSE_ICON_MAP,
  LICENSE_LABEL_MAP,
  StoryCategory,
  StoryLicense
} from "@storiny/shared";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import TagChip from "~/entities/TagChip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CommentIcon from "~/icons/Comment";
import EditIcon from "~/icons/Edit";
import { use_app_selector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import { storyMetadataAtom } from "../../atoms";
import LikeButton from "../layout/right-sidebar/content/read-only/stats/like-button";
import styles from "./story-footer.module.scss";

// License

const License = (): React.ReactElement | null => {
  const story = useAtomValue(storyMetadataAtom);

  if (story.license === StoryLicense.RESERVED) {
    return null;
  }

  return (
    <div className={clsx("flex", styles["footer-row"])}>
      <Typography
        className={clsx("flex-center", "t-minor", styles.x, styles.stat)}
        level={"body2"}
      >
        {LICENSE_ICON_MAP[story.license]}
        License – {LICENSE_LABEL_MAP[story.license]}
      </Typography>
    </div>
  );
};

// Actions

const Actions = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const readCount = story.stats.read_count + 1; // Also include the current reading session

  return (
    <div className={"flex-center"}>
      <Typography
        className={"t-medium"}
        level={"body2"}
        title={`${readCount.toLocaleString()} ${
          readCount === 1 ? "read" : "reads"
        }`}
      >
        {abbreviateNumber(readCount)} {readCount === 1 ? "read" : "reads"}
      </Typography>
      <Grow />
      <LikeButton />
    </div>
  );
};

const StoryFooter = (): React.ReactElement => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const story = useAtomValue(storyMetadataAtom);

  return (
    <footer className={"flex-col"}>
      <Spacer orientation={"vertical"} size={15} />
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      {isSmallerThanDesktop && (
        <React.Fragment>
          <Actions />
          <Spacer orientation={"vertical"} size={3} />
          <Divider />
          <Spacer orientation={"vertical"} size={3} />
        </React.Fragment>
      )}
      {story.category !== StoryCategory.OTHERS || story.edited_at !== null ? (
        <div className={clsx("flex", styles["footer-row"])}>
          {story.category !== StoryCategory.OTHERS && (
            <Typography
              className={clsx("flex-center", "t-minor", styles.x, styles.stat)}
              level={"body2"}
            >
              {CATEGORY_ICON_MAP[story.category]}
              {CATEGORY_LABEL_MAP[story.category]}
            </Typography>
          )}
          {story.edited_at !== null && (
            <Typography
              as={"time"}
              className={clsx("flex-center", "t-minor", styles.x, styles.stat)}
              dateTime={story.edited_at}
              level={"body2"}
              title={formatDate(story.edited_at, DateFormat.LONG)}
            >
              <EditIcon />
              Edited on {formatDate(story.edited_at)}
            </Typography>
          )}
        </div>
      ) : null}
      <Spacer orientation={"vertical"} />
      <License />
      <Spacer orientation={"vertical"} size={2} />
      {story.tags.length ? (
        <React.Fragment>
          <div className={clsx("flex", styles["tag-row"])}>
            {story.tags.map((tag) => (
              <TagChip
                key={tag.id}
                size={isMobile ? "lg" : "md"}
                value={tag.name}
              />
            ))}
          </div>
          <Spacer orientation={"vertical"} size={3} />
        </React.Fragment>
      ) : null}
      <Spacer orientation={"vertical"} size={3} />
    </footer>
  );
};

export default StoryFooter;
