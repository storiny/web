"use client";

import { AccountActivityType } from "@storiny/shared";
import clsx from "clsx";
import React from "react";

import Avatar from "~/components/avatar";
import DateTime from "~/components/date-time";
import Typography from "~/components/typography";
import ExportIcon from "~/icons/export";
import ForbidIcon from "~/icons/forbid";
import KeyIcon from "~/icons/key";
import MailIcon from "~/icons/mail";
import MoodSmileIcon from "~/icons/mood-smile";
import PasswordIcon from "~/icons/password";
import PencilIcon from "~/icons/pencil";
import TwoFAIcon from "~/icons/two-fa";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";

import styles from "./account-activity.module.scss";
import { AccountActivityProps } from "./account-activity.props";
import AccountActivityParser from "./parser";

const ACTIVITY_TYPE_TITLE_MAP: Record<AccountActivityType, string> = {
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

const ACTIVITY_TYPE_ICON_MAP: Record<AccountActivityType, React.ReactNode> = {
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
  const { hide_pipe, className, account_activity, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(
        css["flex"],
        styles["account-activity"],
        hide_pipe && styles["hide-pipe"],
        className
      )}
    >
      <Avatar className={styles.avatar} size={"lg"}>
        {ACTIVITY_TYPE_ICON_MAP[account_activity.type]}
      </Avatar>
      <div className={css["flex-col"]}>
        <Typography ellipsis>
          <span className={css["t-bold"]}>
            {ACTIVITY_TYPE_TITLE_MAP[account_activity.type]}
          </span>{" "}
          <Typography level={"body2"}>
            <span className={css["t-muted"]}>&bull;</span>{" "}
            <span className={css["t-minor"]}>
              <DateTime
                date={account_activity.created_at}
                format={DateFormat.RELATIVE_CAPITALIZED}
              />
            </span>
          </Typography>
        </Typography>
        <Typography as={"div"} color={"minor"} level={"body2"}>
          <AccountActivityParser content={account_activity.description} />
        </Typography>
      </div>
    </div>
  );
};

export default React.memo(AccountActivity);
