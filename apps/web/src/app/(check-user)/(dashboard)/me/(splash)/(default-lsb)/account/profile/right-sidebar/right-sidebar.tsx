import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import PencilIcon from "~/icons/Pencil";
import TrashIcon from "~/icons/Trash";
import RightSidebar from "~/layout/RightSidebar";
import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import styles from "./right-sidebar.module.scss";

interface Props {}

const AccountProfileRightSidebar = (): React.ReactElement => {
  const user = useAppSelector(selectUser)!;
  return (
    <RightSidebar className={clsx(styles.x, styles["right-sidebar"])}>
      <div className={clsx("flex-center", styles.x, styles.header)}>
        <Avatar
          alt={""}
          avatarId={user.avatar_id}
          hex={user.avatar_hex}
          label={user.name}
          size={"xl2"}
        />
        <div className={"flex-col"}>
          <Button decorator={<PencilIcon />} variant={"hollow"}>
            Edit
          </Button>
          <Spacer orientation={"vertical"} />
          <Button decorator={<TrashIcon />} variant={"hollow"}>
            Remove
          </Button>
        </div>
      </div>
      <Typography className={"t-minor"} level={"body3"}>
        We recommend using a PNG, JPG, WEBP, or GIF with a minimum resolution of
        640 pixels in a square shape.
      </Typography>
      {/* Push the footer to the bottom of the viewport */}
      <Grow />
    </RightSidebar>
  );
};

export default AccountProfileRightSidebar;
