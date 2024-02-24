import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import BioParser from "~/entities/bio-parser";
import CustomState from "~/entities/custom-state";
import Persona from "~/entities/persona";
import ForbidIcon from "~/icons/forbid";
import BottomNavigation from "~/layout/bottom-navigation";
import LeftSidebar from "~/layout/left-sidebar";
import Navbar from "~/layout/navbar";
import RightSidebar from "~/layout/right-sidebar";
import Sidenav from "~/layout/sidenav";
import SplashScreen from "~/layout/splash-screen";
import { sync_with_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

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
    <div className={clsx(css["grid"], css["grid-container"])}>
      <Navbar />
      <Sidenav />
      <LeftSidebar />
      <main data-root={"true"}>
        <CustomState
          auto_size
          description={
            type === "user-blocked" ? (
              <>
                You cannot access this story as you have been blocked by{" "}
                <span className={css["t-medium"]}>@{user.username}</span>.
              </>
            ) : (
              <>
                <span className={css["t-medium"]}>@{user.username}</span> has
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
        <div className={css["flex-col"]}>
          <Persona
            avatar={{
              alt: `${user.name}'s avatar`,
              avatar_id: user.avatar_id,
              label: user.name,
              hex: user.avatar_hex
            }}
            className={css["fit-w"]}
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
          {(user.rendered_bio || "").trim() ? (
            <React.Fragment>
              <Spacer orientation={"vertical"} size={2} />
              <Typography as={"div"} className={css["t-minor"]} level={"body2"}>
                <BioParser content={user.rendered_bio} />
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
