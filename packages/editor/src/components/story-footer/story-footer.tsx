import { StoryCategory, StoryLicense } from "@storiny/shared";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP
} from "@storiny/shared/src/constants/category-icon-map";
import {
  LICENSE_ICON_MAP,
  LICENSE_LABEL_MAP
} from "@storiny/shared/src/constants/license-icon-map";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Divider from "../../../../ui/src/components/divider";
import Grow from "../../../../ui/src/components/grow";
import Spacer from "../../../../ui/src/components/spacer";
import Typography from "../../../../ui/src/components/typography";
import TagChip from "../../../../ui/src/entities/tag-chip";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import EditIcon from "../../../../ui/src/icons/edit";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../ui/src/utils/abbreviate-number";
import { DateFormat, format_date } from "../../../../ui/src/utils/format-date";

import { story_metadata_atom } from "../../atoms";
import LikeButton from "../layout/right-sidebar/content/read-only/stats/like-button";
import styles from "./story-footer.module.scss";

// License

const License = (): React.ReactElement | null => {
  const story = use_atom_value(story_metadata_atom);

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
  const story = use_atom_value(story_metadata_atom);
  const read_count = story.stats.read_count + 1; // Also include the current reading session

  return (
    <div className={"flex-center"}>
      <Typography
        className={"t-medium"}
        level={"body2"}
        title={`${read_count.toLocaleString()} ${
          read_count === 1 ? "read" : "reads"
        }`}
      >
        {abbreviate_number(read_count)} {read_count === 1 ? "read" : "reads"}
      </Typography>
      <Grow />
      <LikeButton />
    </div>
  );
};

const StoryFooter = (): React.ReactElement => {
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const story = use_atom_value(story_metadata_atom);

  return (
    <footer className={"flex-col"}>
      <Spacer orientation={"vertical"} size={15} />
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      {is_smaller_than_desktop && (
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
              title={format_date(story.edited_at, DateFormat.LONG)}
            >
              <EditIcon />
              Edited on {format_date(story.edited_at)}
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
                size={is_mobile ? "lg" : "md"}
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
