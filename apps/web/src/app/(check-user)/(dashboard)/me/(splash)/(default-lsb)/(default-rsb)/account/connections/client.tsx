"use client";

import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import NoSsr from "~/components/no-ssr";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { DateFormat, format_date } from "~/utils/format-date";

import {
  PROVIDER_DISPLAY_NAME_MAP,
  PROVIDER_ICON_MAP,
  PROVIDER_KEY_MAP
} from "../../../../../../../../(alpha)/providers";
import DashboardGroup from "../../../dashboard-group";
import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import ConnectionButton from "./connection-button";
import { ConnectionsProps } from "./connections.props";
import styles from "./styles.module.scss";
import VisibilityButton from "./visibility-button";

const ConnectionItem = ({
  connection: connection_prop,
  provider
}: {
  connection?: ConnectionsProps["connections"][number];
  provider: string;
}): React.ReactElement => {
  const [connection, set_connection] =
    React.useState<typeof connection_prop>(connection_prop);
  return (
    <li
      className={clsx(
        css["flex"],
        Boolean(connection) && styles.connected,
        styles.item
      )}
    >
      <div className={clsx(css["flex-center"], styles.details)}>
        <span className={styles.icon}>
          {React.createElement(
            PROVIDER_ICON_MAP[connection?.provider || provider]
          )}
        </span>
        <div className={css["flex-col"]}>
          {connection ? (
            <Link
              className={css["t-medium"]}
              ellipsis
              fixed_color
              href={connection.url}
              target={"_blank"}
              title={connection.display_name}
            >
              {connection.display_name}
            </Link>
          ) : (
            <Typography className={css["t-medium"]}>
              {PROVIDER_DISPLAY_NAME_MAP[provider]}
            </Typography>
          )}
          {connection ? (
            <NoSsr>
              <Typography
                className={css["t-minor"]}
                ellipsis
                level={"body2"}
                title={format_date(connection.created_at, DateFormat.STANDARD)}
              >
                {PROVIDER_DISPLAY_NAME_MAP[connection.provider]}{" "}
                <span className={css["t-muted"]}>&bull;</span> Connected{" "}
                {format_date(connection.created_at, DateFormat.RELATIVE)}
              </Typography>
            </NoSsr>
          ) : (
            <Typography className={css["t-minor"]} level={"body2"}>
              Not connected
            </Typography>
          )}
        </div>
      </div>
      <div className={clsx(css["flex-center"], styles.actions)}>
        {connection && <VisibilityButton connection={connection} />}
        <ConnectionButton
          connection={connection}
          on_remove={(): void => set_connection(undefined)}
          provider={provider}
        />
      </div>
    </li>
  );
};

const ConnectionSettingsClient = ({
  connections
}: ConnectionsProps): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Connections</DashboardTitle>
    <DashboardWrapper>
      <DashboardGroup>
        <Typography className={css["t-minor"]} level={"body2"}>
          Link your social media accounts to display them on your public
          profile. Data provided by your selected provider is used for display
          purposes only and is never shared outside of Storiny. Read our{" "}
          <Link href={"/privacy"} target={"_blank"} underline={"always"}>
            Privacy Policy
          </Link>{" "}
          for more details about how we regulate your data.
          <br />
          <br />
          Note that social media providers operate independent of us, and
          linking your external account to Storiny implies agreeing to their
          terms and privacy policy.
          <br />
          <br />
          To delete all your social media data, disconnect your social account
          from this page. If you want to temporarily hide your social media
          account on your profile, you can use the &quot;Hide&quot; button.
        </Typography>
        <Spacer orientation={"vertical"} size={5} />
        <ul className={clsx(css["flex-col"], styles.list)}>
          {Object.keys(PROVIDER_KEY_MAP)
            .filter((item) => Boolean(PROVIDER_KEY_MAP[item])) // Filter out unspecified and unrecognized items
            .map((provider) => (
              <ConnectionItem
                connection={connections.find(
                  (connection) => String(connection.provider) === provider
                )}
                key={provider}
                provider={provider}
              />
            ))}
        </ul>
      </DashboardGroup>
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default ConnectionSettingsClient;
