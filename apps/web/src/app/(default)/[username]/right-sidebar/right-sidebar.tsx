import { clsx } from "clsx";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import Grow from "~/components/grow";
import RightSidebar from "~/layout/right-sidebar";

import ProfileContent from "../content";
import styles from "./right-sidebar.module.scss";

interface Props {
  is_private: boolean;
  is_suspended: boolean;
  profile: GetProfileResponse;
}

const ProfileRightSidebar = ({
  profile,
  is_private,
  is_suspended
}: Props): React.ReactElement => (
  <RightSidebar
    className={clsx(
      styles.x,
      styles["right-sidebar"],
      Boolean(profile.banner_id) &&
        !is_private &&
        !is_suspended &&
        !profile.is_blocked_by_user &&
        styles["has-banner"]
    )}
  >
    <ProfileContent
      is_inside_sidebar
      is_private={is_private}
      is_suspended={is_suspended}
      profile={profile}
    />
    {/* Push the footer to the bottom of the viewport */}
    <Grow />
  </RightSidebar>
);

export default ProfileRightSidebar;
