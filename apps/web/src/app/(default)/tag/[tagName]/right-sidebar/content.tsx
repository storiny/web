import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Separator from "~/components/Separator";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import CheckIcon from "~/icons/Check";
import PencilPlusIcon from "~/icons/PencilPlus";
import PlusIcon from "~/icons/Plus";
import TagIcon from "~/icons/Tag";
import UsersIcon from "~/icons/Users";
import { TitleWithIcon, UserWithActionSkeleton } from "~/layout/RightSidebar";
import UserWithAction from "~/layout/RightSidebar/UserWithAction";
import {
  getQueryErrorType,
  overwriteFollowedTag,
  selectFollowedTag,
  toggleFollowedTag,
  useGetTagWritersQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import TagActions from "../actions";
import styles from "./right-sidebar.module.scss";

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
    <div className={clsx("flex", styles.x, styles.actions)}>
      <Button
        checkAuth
        decorator={isFollowing ? <CheckIcon /> : <PlusIcon />}
        onClick={(): void => {
          dispatch(toggleFollowedTag(tag.id));
        }}
        variant={isFollowing ? "hollow" : "rigid"}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <Button
        as={NextLink}
        checkAuth
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
  const { isLoading, isFetching, error, isError, data, refetch } =
    useGetTagWritersQuery({ tagName });

  return (
    <>
      {isError ? (
        <ErrorState
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          size={"sm"}
          type={getQueryErrorType(error)}
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
