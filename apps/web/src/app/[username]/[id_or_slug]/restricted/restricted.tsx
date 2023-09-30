import { clsx } from "clsx";
import React from "react";

import Link from "../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../packages/ui/src/components/typography";
import CustomState from "../../../../../../../packages/ui/src/entities/custom-state";
import Persona from "../../../../../../../packages/ui/src/entities/persona";
import ForbidIcon from "../../../../../../../packages/ui/src/icons/forbid";
import BottomNavigation from "../../../../../../../packages/ui/src/layout/bottom-navigation";
import LeftSidebar from "../../../../../../../packages/ui/src/layout/left-sidebar";
import Navbar from "../../../../../../../packages/ui/src/layout/navbar";
import RightSidebar from "../../../../../../../packages/ui/src/layout/right-sidebar";
import Sidenav from "../../../../../../../packages/ui/src/layout/sidenav";
import SplashScreen from "../../../../../../../packages/ui/src/layout/splash-screen";
import { sync_with_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../packages/ui/src/utils/abbreviate-number";

import { RestrictedStoryProps } from "./restricted.props";

const RestrictedStory = (props: RestrictedStoryProps): React.ReactElement => {
  const { user, type } = props;
  const dispatch = use_app_dispatch();
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[user.id]) || 0;

  React.useEffect(() => {
    dispatch(sync_with_user(user));
  }, [dispatch, user]);

  return (
    <div className={clsx("grid", "grid-container")}>
      <Navbar />
      <Sidenav />
      <LeftSidebar />
      <main>
        <CustomState
          auto_size
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
              avatar_id: user.avatar_id,
              label: user.name,
              hex: user.avatar_hex
            }}
            className={"fit-w"}
            component_props={{
              secondary_text: {
                ellipsis: true
              }
            }}
            primary_text={
              <Link ellipsis fixed_color href={`/${user.username}`}>
                {user.name}
              </Link>
            }
            secondary_text={
              <>
                @{user.username} &bull; {abbreviate_number(follower_count)}{" "}
                {follower_count === 1 ? "follower" : "followers"}
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
