"use client";

import { AccountActivityType } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import Typography from "~/components/Typography";
import ExportIcon from "~/icons/Export";
import ForbidIcon from "~/icons/Forbid";
import KeyIcon from "~/icons/Key";
import MailIcon from "~/icons/Mail";
import MoodSmileIcon from "~/icons/MoodSmile";
import PasswordIcon from "~/icons/Password";
import PencilIcon from "~/icons/Pencil";
import TwoFAIcon from "~/icons/TwoFA";
import { DateFormat, formatDate } from "~/utils/formatDate";

import styles from "./AccountActivity.module.scss";
import { AccountActivityProps } from "./AccountActivity.props";
import AccountActivityParser from "./Parser";

const activityTypeToTitleMap: Record<AccountActivityType, string> = {
  [AccountActivityType.ACCOUNT_CREATION /* */]: "Account created",
  [AccountActivityType.ACCOUNT_MODIFIED /* */]: "Account",
  [AccountActivityType.MFA /*              */]: "Two-factor authentication",
  [AccountActivityType.EMAIL /*            */]: "Email",
  [AccountActivityType.PASSWORD /*         */]: "Password",
  [AccountActivityType.USERNAME /*         */]: "Username",
  [AccountActivityType.DATA_EXPORT /*      */]: "Data export",
  [AccountActivityType.THIRD_PARTY_LOGIN /**/]: "Third-party login",
  [AccountActivityType.PRIVACY /*          */]: "Privacy"
};

const activityTypeToIconMap: Record<AccountActivityType, React.ReactNode> = {
  [AccountActivityType.ACCOUNT_CREATION /* */]: <MoodSmileIcon />,
  [AccountActivityType.ACCOUNT_MODIFIED /* */]: <ForbidIcon />,
  [AccountActivityType.MFA /*              */]: <TwoFAIcon />,
  [AccountActivityType.EMAIL /*            */]: <MailIcon />,
  [AccountActivityType.PASSWORD /*         */]: <PasswordIcon />,
  [AccountActivityType.USERNAME /*         */]: <PencilIcon />,
  [AccountActivityType.DATA_EXPORT /*      */]: <ExportIcon />,
  [AccountActivityType.THIRD_PARTY_LOGIN /**/]: <KeyIcon />,
  [AccountActivityType.PRIVACY /*          */]: <KeyIcon />
};

const AccountActivity = (props: AccountActivityProps): React.ReactElement => {
  const { hidePipe, className, accountActivity, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(
        "flex",
        styles["account-activity"],
        hidePipe && styles["hide-pipe"],
        className
      )}
    >
      <Avatar className={styles.avatar} size={"lg"}>
        {activityTypeToIconMap[accountActivity.type]}
      </Avatar>
      <div className={"flex-col"}>
        <Typography ellipsis>
          <span className={"t-bold"}>
            {activityTypeToTitleMap[accountActivity.type]}
          </span>{" "}
          <Typography level={"body2"}>
            <span className={"t-muted"}>&bull;</span>{" "}
            <span className={"t-minor"}>
              {formatDate(
                accountActivity.created_at,
                DateFormat.RELATIVE_CAPITALIZED
              )}
            </span>
          </Typography>
        </Typography>
        <Typography as={"div"} className={"t-minor"} level={"body2"}>
          <AccountActivityParser content={accountActivity.description} />
        </Typography>
      </div>
    </div>
  );
};

export default React.memo(AccountActivity);
