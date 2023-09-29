import { clsx } from "clsx";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import Grow from "../../../../../../../packages/ui/src/components/grow";
import RightSidebar from "../../../../../../../packages/ui/src/layout/right-sidebar";

import ProfileContent from "../content";
import styles from "./right-sidebar.module.scss";

interface Props {
  isPrivate: boolean;
  isSuspended: boolean;
  profile: GetProfileResponse;
}

const ProfileRightSidebar = ({
  profile,
  isPrivate,
  isSuspended
}: Props): React.ReactElement => (
  <RightSidebar
    className={clsx(
      styles.x,
      styles["right-sidebar"],
      Boolean(profile.banner_id) &&
        !isPrivate &&
        !isSuspended &&
        !profile.is_blocked_by_user &&
        styles["has-banner"]
    )}
  >
    <ProfileContent
      isInsideSidebar
      isPrivate={isPrivate}
      isSuspended={isSuspended}
      profile={profile}
    />
    {/* Push the footer to the bottom of the viewport */}
    <Grow />
  </RightSidebar>
);

export default ProfileRightSidebar;
