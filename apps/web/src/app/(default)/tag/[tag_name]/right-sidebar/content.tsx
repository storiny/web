"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Separator from "~/components/separator";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import CheckIcon from "~/icons/check";
import PencilPlusIcon from "~/icons/pencil-plus";
import PlusIcon from "~/icons/plus";
import TagIcon from "~/icons/tag";
import UsersIcon from "~/icons/users";
import { TitleWithIcon, UserWithActionSkeleton } from "~/layout/right-sidebar";
import UserWithAction from "~/layout/right-sidebar/user-with-action";
import {
  boolean_action,
  get_query_error_type,
  use_get_tag_writers_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import TagActions from "../actions";
import styles from "./right-sidebar.module.scss";

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
    dispatch(
      boolean_action("followed_tags", tag.id, Boolean(tag.is_following))
    );
  }, [dispatch, tag.is_following, tag.id]);

  return (
    <div className={clsx(css["flex"], styles.actions)}>
      <Button
        check_auth
        decorator={is_following ? <CheckIcon /> : <PlusIcon />}
        onClick={(): void => {
          dispatch(boolean_action("followed_tags", tag.id));
        }}
        variant={is_following ? "hollow" : "rigid"}
      >
        {is_following ? "Following" : "Follow"}
      </Button>
      <Button
        as={NextLink}
        check_auth
        decorator={<PencilPlusIcon />}
        href={`/new?tag=${tag.name}`}
        variant={"hollow"}
      >
        Write a story
      </Button>
    </div>
  );
};

// Top writers

const TopWriters = ({ tag_name }: { tag_name: string }): React.ReactElement => {
  const {
    isLoading: is_loading,
    isFetching: is_fetching,
    error,
    isError: is_error,
    data,
    refetch
  } = use_get_tag_writers_query({ tag_name });

  return (
    <>
      {is_error ? (
        <ErrorState
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          size={"sm"}
          type={get_query_error_type(error)}
        />
      ) : is_loading ? (
        [...Array(5)].map((_, index) => <UserWithActionSkeleton key={index} />)
      ) : (
        data?.map((user) => <UserWithAction key={user.id} user={user} />)
      )}
    </>
  );
};

const SuspendedTagRightSidebarContent = ({
  tag
}: Props): React.ReactElement => (
  <>
    <div className={clsx(css["flex-center"], styles.meta)}>
      <TagIcon className={clsx(styles.x, styles["meta-icon"])} />
      <Typography as={"h1"} ellipsis level={"h3"}>
        {tag.name}
      </Typography>
      <Grow />
      <TagActions tag={tag} />
    </div>
    <div className={clsx(css["flex-col"], styles.properties)}>
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
            {abbreviate_number(tag.follower_count)}
          </span>{" "}
          {tag.follower_count === 1 ? "follower" : "followers"}
        </Typography>
      </div>
      <Actions tag={tag} />
    </div>
    <Separator />
    <TitleWithIcon icon={<UsersIcon />}>
      Top writers in #{tag.name}
    </TitleWithIcon>
    <TopWriters tag_name={tag.name} />
  </>
);

export default SuspendedTagRightSidebarContent;
