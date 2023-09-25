import { clsx } from "clsx";
import React from "react";

import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import CustomState from "~/entities/CustomState";
import Persona from "~/entities/Persona";
import ForbidIcon from "~/icons/Forbid";
import BottomNavigation from "~/layout/BottomNavigation";
import LeftSidebar from "~/layout/LeftSidebar";
import Navbar from "~/layout/Navbar";
import RightSidebar from "~/layout/RightSidebar";
import Sidenav from "~/layout/Sidenav";
import SplashScreen from "~/layout/SplashScreen";
import { syncWithUser } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { RestrictedStoryProps } from "./restricted.props";

const RestrictedStory = (props: RestrictedStoryProps): React.ReactElement => {
  const { user, type } = props;
  const dispatch = useAppDispatch();
  const followerCount =
    useAppSelector((state) => state.entities.followerCounts[user.id]) || 0;

  React.useEffect(() => {
    dispatch(syncWithUser(user));
  }, [dispatch, user]);

  return (
    <div className={clsx("grid", "grid-container")}>
      <Navbar />
      <Sidenav />
      <LeftSidebar />
      <main>
        <CustomState
          autoSize
          description={
            type === "user-blocked" ? (
              <>
                You cannot access this story as you have been blocked by{" "}
                <span className={"t-medium"}>@{user.username}</span>.
              </>
            ) : (
              <>
                <span className={"t-medium"}>@{user.username}</span> has
                unpublished this story.
              </>
            )
          }
          icon={<ForbidIcon />}
          title={
            type === "user-blocked"
              ? "You are being restricted"
              : "This story has been unpublished"
          }
        />
      </main>
      <RightSidebar>
        <div className={"flex-col"}>
          <Persona
            avatar={{
              alt: `${user.name}'s avatar`,
              avatarId: user.avatar_id,
              label: user.name,
              hex: user.avatar_hex
            }}
            className={"fit-w"}
            componentProps={{
              secondaryText: {
                ellipsis: true
              }
            }}
            primaryText={
              <Link ellipsis fixedColor href={`/${user.username}`}>
                {user.name}
              </Link>
            }
            secondaryText={
              <>
                @{user.username} &bull; {abbreviateNumber(followerCount)}{" "}
                {followerCount === 1 ? "follower" : "followers"}
              </>
            }
            size={"lg"}
          />
          {user.bio.trim() ? (
            <React.Fragment>
              <Spacer orientation={"vertical"} size={2} />
              <Typography className={"t-minor"} level={"body2"}>
                {user.bio}
              </Typography>
            </React.Fragment>
          ) : null}
        </div>
      </RightSidebar>
      <SplashScreen />
      <BottomNavigation />
    </div>
  );
};

export default RestrictedStory;
