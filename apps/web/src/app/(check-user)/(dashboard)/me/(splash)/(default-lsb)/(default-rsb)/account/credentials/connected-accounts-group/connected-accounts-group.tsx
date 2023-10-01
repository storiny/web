import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import TitleBlock from "~/entities/title-block";
import CheckIcon from "~/icons/check";

import DashboardGroup from "../../../../dashboard-group";
import styles from "./connected-accounts-group.module.scss";
import { ConnectedAccountsGroupProps } from "./connected-accounts-group.props";
import RemoveAccount from "./remove-account";

// Icons

const AppleIcon = (): React.ReactElement => (
  <svg fill="none" height={32} width={32} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M28.37 24.57a16.68 16.68 0 0 1-1.64 2.96 15.06 15.06 0 0 1-2.13 2.57 4.12 4.12 0 0 1-2.73 1.2c-.7 0-1.54-.2-2.52-.6-.98-.4-1.89-.6-2.71-.6-.87 0-1.8.2-2.8.6-1 .4-1.8.61-2.4.63-.94.04-1.87-.37-2.8-1.23-.6-.52-1.33-1.4-2.22-2.66a18.38 18.38 0 0 1-2.35-4.67 17.08 17.08 0 0 1-.99-5.56c0-2.05.45-3.83 1.34-5.31A7.82 7.82 0 0 1 10.99 8c.74 0 1.71.24 2.92.69 1.2.45 1.97.68 2.31.68.26 0 1.12-.27 2.57-.8a8.5 8.5 0 0 1 3.5-.62c2.57.2 4.51 1.22 5.8 3.05-2.3 1.4-3.45 3.36-3.42 5.87a6.47 6.47 0 0 0 2.12 4.88c.63.6 1.34 1.06 2.13 1.4-.18.49-.36.96-.55 1.42ZM22.46 1.28c0 1.53-.56 2.97-1.68 4.3-1.35 1.57-2.98 2.48-4.75 2.33a4.78 4.78 0 0 1-.03-.58c0-1.47.64-3.05 1.78-4.33.57-.66 1.29-1.2 2.16-1.63.88-.43 1.7-.66 2.48-.7.03.2.04.4.04.61Z"
      fill="var(--inverted-_negative)"
    />
  </svg>
);

const GoogleIcon = (): React.ReactElement => (
  <svg fill="none" height={32} width={32} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M30.72 15.68c0-1.09-.1-2.13-.28-3.13H16v5.93h8.25a7.05 7.05 0 0 1-3.06 4.62v3.85h4.96c2.9-2.67 4.57-6.6 4.57-11.27Z"
      fill="#4285F4"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M16 30.67c4.14 0 7.61-1.38 10.15-3.72l-4.96-3.85A9.22 9.22 0 0 1 16 24.57c-4 0-7.37-2.7-8.58-6.32H2.3v3.97A15.33 15.33 0 0 0 16 30.67Z"
      fill="#34A853"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M7.42 18.25a9.22 9.22 0 0 1 0-5.83V8.45H2.3a15.33 15.33 0 0 0 0 13.77l5.12-3.97Z"
      fill="#FBBC05"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M16 6.1c2.25 0 4.27.77 5.86 2.3l4.4-4.4C23.6 1.51 20.13 0 16 0 10 0 4.82 3.44 2.3 8.45l5.12 3.97A9.14 9.14 0 0 1 16 6.1Z"
      fill="#EA4335"
      fillRule="evenodd"
    />
  </svg>
);

// Account

const Account = ({
  connected,
  icon,
  label,
  action
}: {
  action: React.ReactNode;
  connected: boolean;
  icon: React.ReactNode;
  label: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx("flex-center", styles.account)}>
    <div className={clsx("flex-center", styles.details)}>
      {icon}
      <div className={clsx("flex-col")}>
        <Typography level={"body2"}>{label}</Typography>
        <Spacer orientation={"vertical"} size={0.25} />
        <span className={clsx("flex-center", styles.status)}>
          {connected && <CheckIcon />}
          <Typography as={"span"} className={"t-minor"} level={"body3"}>
            {connected ? "Connected" : "Not connected"}
          </Typography>
        </span>
      </div>
    </div>
    <Grow />
    {action}
  </div>
);

// Apple account

const AppleAccount = ({
  has_password,
  login_apple_id
}: Pick<
  ConnectedAccountsGroupProps,
  "has_password" | "login_apple_id"
>): React.ReactElement => {
  const [connected, set_connected] = React.useState<boolean>(
    Boolean(login_apple_id)
  );

  return (
    <Account
      action={
        connected ? (
          <RemoveAccount
            on_remove={(): void => set_connected(false)}
            vendor={"Apple"}
          />
        ) : (
          <Button
            auto_size
            check_auth
            disabled={Boolean(login_apple_id) && !has_password}
            variant={"hollow"}
          >
            Connect
          </Button>
        )
      }
      connected={Boolean(login_apple_id)}
      icon={<AppleIcon />}
      label={"Apple"}
    />
  );
};

// Google account

const GoogleAccount = ({
  has_password,
  login_google_id
}: Pick<
  ConnectedAccountsGroupProps,
  "has_password" | "login_google_id"
>): React.ReactElement => {
  const [connected, set_connected] = React.useState<boolean>(
    Boolean(login_google_id)
  );

  return (
    <Account
      action={
        connected ? (
          <RemoveAccount
            on_remove={(): void => set_connected(false)}
            vendor={"Google"}
          />
        ) : (
          <Button
            auto_size
            check_auth
            disabled={Boolean(login_google_id) && !has_password}
            variant={"hollow"}
          >
            Connect
          </Button>
        )
      }
      connected={Boolean(login_google_id)}
      icon={<GoogleIcon />}
      label={"Google"}
    />
  );
};

const CredentialsConnectedAccountsGroup = (
  props: ConnectedAccountsGroupProps
): React.ReactElement => {
  const { has_password, login_google_id, login_apple_id } = props;
  return (
    <DashboardGroup>
      <TitleBlock title={"Connected accounts"}>
        These are the social media accounts that you linked to your Storiny
        account for logging in. To revoke access to any of these accounts, you
        need to add a password to your Storiny account, so that you don&apos;t
        lose access to it.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4.5} />
      <div className={clsx("flex-col")}>
        <AppleAccount
          has_password={has_password}
          login_apple_id={login_apple_id}
        />
        <Spacer orientation={"vertical"} size={1.5} />
        <GoogleAccount
          has_password={has_password}
          login_google_id={login_google_id}
        />
      </div>
    </DashboardGroup>
  );
};

export default CredentialsConnectedAccountsGroup;
