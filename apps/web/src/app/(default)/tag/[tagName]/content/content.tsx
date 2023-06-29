import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import CheckIcon from "~/icons/Check";
import PencilPlusIcon from "~/icons/PencilPlus";
import PlusIcon from "~/icons/Plus";
import TagIcon from "~/icons/Tag";
import {
  overwriteFollowedTag,
  selectFollowedTag,
  toggleFollowedTag,
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import TagActions from "../actions";
import styles from "./content.module.scss";

interface Props {
  tag: GetTagResponse;
}

// Actions

const Actions = ({ tag }: Props): React.ReactElement => {
  const dispatch = useAppDispatch();
  const isFollowing = useAppSelector(selectFollowedTag(tag.id));

  React.useEffect(() => {
    dispatch(overwriteFollowedTag([tag.id, Boolean(tag.is_following)]));
  }, [dispatch, tag.is_following, tag.id]);

  return (
    <div className={clsx("flex", styles.actions)}>
      <Button
        checkAuth
        decorator={isFollowing ? <CheckIcon /> : <PlusIcon />}
        onClick={(): void => {
          dispatch(toggleFollowedTag(tag.id));
        }}
        size={"lg"}
        variant={isFollowing ? "hollow" : "rigid"}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <Button
        as={NextLink}
        checkAuth
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

const SuspendedTagContent = ({ tag }: Props): React.ReactElement => (
  <div className={clsx("flex-col", styles.content)}>
    <div className={clsx("flex-center", styles.meta)}>
      <TagIcon className={styles["meta-icon"]} />
      <Typography level={"h1"}>{tag.name}</Typography>
      <Grow />
      <TagActions tag={tag} />
    </div>
    <div className={clsx("flex", styles.stats)}>
      <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
        <span className={clsx("t-bold", "t-major")}>
          {abbreviateNumber(tag.story_count)}
        </span>{" "}
        {tag.story_count === 1 ? "story" : "stories"}
      </Typography>
      <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
        <span className={clsx("t-bold", "t-major")}>
          {abbreviateNumber(tag.follower_count)}
        </span>{" "}
        {tag.follower_count === 1 ? "follower" : "followers"}
      </Typography>
    </div>
    <Spacer orientation={"vertical"} size={0.5} />
    <Actions tag={tag} />
  </div>
);

export default SuspendedTagContent;
