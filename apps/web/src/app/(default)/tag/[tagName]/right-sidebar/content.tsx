import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import Button from "../../../../../../../../packages/ui/src/components/button";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Separator from "../../../../../../../../packages/ui/src/components/separator";
import Typography from "../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../packages/ui/src/entities/error-state";
import CheckIcon from "../../../../../../../../packages/ui/src/icons/check";
import PencilPlusIcon from "../../../../../../../../packages/ui/src/icons/pencil-plus";
import PlusIcon from "../../../../../../../../packages/ui/src/icons/plus";
import TagIcon from "../../../../../../../../packages/ui/src/icons/tag";
import UsersIcon from "../../../../../../../../packages/ui/src/icons/users";
import {
  TitleWithIcon,
  UserWithActionSkeleton
} from "../../../../../../../../packages/ui/src/layout/right-sidebar";
import UserWithAction from "../../../../../../../../packages/ui/src/layout/right-sidebar/user-with-action";
import {
  boolean_action,
  get_query_error_type,
  setFollowedTag,
  use_get_tag_writers_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../packages/ui/src/utils/abbreviate-number";

import TagActions from "../actions";
import styles from "./right-sidebar.module.scss";

interface Props {
  tag: GetTagResponse;
}

// Actions

const Actions = ({ tag }: Props): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const isFollowing = use_app_selector(
    (state) => state.entities.followed_tags[tag.id]
  );

  React.useEffect(() => {
    dispatch(
      boolean_action("followed_tags", tag.id, Boolean(tag.is_following))
    );
  }, [dispatch, tag.is_following, tag.id]);

  return (
    <div className={clsx("flex", styles.x, styles.actions)}>
      <Button
        check_auth
        decorator={isFollowing ? <CheckIcon /> : <PlusIcon />}
        onClick={(): void => {
          dispatch(boolean_action("followed_tags", tag.id));
        }}
        variant={isFollowing ? "hollow" : "rigid"}
      >
        {isFollowing ? "Following" : "Follow"}
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

const TopWriters = ({ tagName }: { tagName: string }): React.ReactElement => {
  const { isLoading, is_fetching, error, isError, data, refetch } =
    use_get_tag_writers_query({ tagName });

  return (
    <>
      {isError ? (
        <ErrorState
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          size={"sm"}
          type={get_query_error_type(error)}
        />
      ) : isLoading ? (
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
    <div className={clsx("flex-center", styles.x, styles.meta)}>
      <TagIcon className={clsx(styles.x, styles["meta-icon"])} />
      <Typography as={"h1"} ellipsis level={"h3"}>
        {tag.name}
      </Typography>
      <Grow />
      <TagActions tag={tag} />
    </div>
    <div className={clsx("flex-col", styles.x, styles.properties)}>
      <div className={clsx("flex", styles.x, styles.stats)}>
        <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
          <span className={clsx("t-bold", "t-major")}>
            {abbreviate_number(tag.story_count)}
          </span>{" "}
          {tag.story_count === 1 ? "story" : "stories"}
        </Typography>
        <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
          <span className={clsx("t-bold", "t-major")}>
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
    <TopWriters tagName={tag.name} />
  </>
);

export default SuspendedTagRightSidebarContent;
