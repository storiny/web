import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import CheckIcon from "~/icons/check";
import PencilPlusIcon from "~/icons/pencil-plus";
import PlusIcon from "~/icons/plus";
import TagIcon from "~/icons/tag";
import { boolean_action, sync_with_tag } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import TagActions from "../actions";
import styles from "./content.module.scss";

interface Props {
  tag: GetTagResponse;
}

// Actions

const Actions = ({ tag }: Props): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const is_following = use_app_selector(
    (state) => state.entities.followed_tags[tag.id]
  );

  React.useEffect(() => {
    dispatch(sync_with_tag(tag));
  }, [dispatch, tag]);

  return (
    <div className={clsx(css["flex"], styles.actions)}>
      <Button
        check_auth
        decorator={is_following ? <CheckIcon /> : <PlusIcon />}
        onClick={(): void => {
          dispatch(boolean_action("followed_tags", tag.id));
        }}
        size={"lg"}
        variant={is_following ? "hollow" : "rigid"}
      >
        {is_following ? "Following" : "Follow"}
      </Button>
      <Button
        as={NextLink}
        check_auth
        decorator={<PencilPlusIcon />}
        href={`/new?tag=${tag.name}`}
        size={"lg"}
        variant={"hollow"}
      >
        Write a story
      </Button>
    </div>
  );
};

const SuspendedTagContent = ({ tag }: Props): React.ReactElement => {
  const follower_count =
    use_app_selector((state) => state.entities.tag_follower_counts[tag.id]) ||
    0;

  return (
    <div className={clsx(css["flex-col"], styles.content)}>
      <div className={clsx(css["flex-center"], styles.meta)}>
        <TagIcon className={clsx(styles.x, styles["meta-icon"])} />
        <Typography level={"h1"}>{tag.name}</Typography>
        <Grow />
        <TagActions tag={tag} />
      </div>
      <div className={clsx(css["flex"], styles.stats)}>
        <Typography
          className={clsx(css["t-medium"], css["t-minor"])}
          level={"body2"}
        >
          <span className={clsx(css["t-bold"], css["t-major"])}>
            {abbreviate_number(tag.story_count)}
          </span>{" "}
          {tag.story_count === 1 ? "story" : "stories"}
        </Typography>
        <Typography
          className={clsx(css["t-medium"], css["t-minor"])}
          level={"body2"}
        >
          <span className={clsx(css["t-bold"], css["t-major"])}>
            {abbreviate_number(follower_count)}
          </span>{" "}
          {follower_count === 1 ? "follower" : "followers"}
        </Typography>
      </div>
      <Spacer orientation={"vertical"} size={0.5} />
      <Actions tag={tag} />
    </div>
  );
};

export default SuspendedTagContent;
