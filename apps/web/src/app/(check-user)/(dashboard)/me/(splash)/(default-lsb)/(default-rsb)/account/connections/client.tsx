"use client";

import { clsx } from "clsx";
import React from "react";

import Link from "../../../../../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";
import {
  DateFormat,
  format_date
} from "../../../../../../../../../../../../packages/ui/src/utils/format-date";

import {
  PROVIDER_DISPLAY_NAME_MAP,
  PROVIDER_ICON_MAP,
  PROVIDER_KEY_MAP
} from "../../../../../../../../providers";
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
        "flex",
        Boolean(connection) && styles.connected,
        styles.item
      )}
    >
      <div className={clsx("flex-center", styles.details)}>
        <span className={styles.icon}>
          {React.createElement(
            PROVIDER_ICON_MAP[connection?.provider || provider]
          )}
        </span>
        <div className={"flex-col"}>
          {connection ? (
            <Link
              className={"t-medium"}
              ellipsis
              fixed_color
              href={connection.url}
              target={"_blank"}
              title={connection.display_name}
            >
              {connection.display_name}
            </Link>
          ) : (
            <Typography className={"t-medium"}>
              {PROVIDER_DISPLAY_NAME_MAP[provider]}
            </Typography>
          )}
          {connection ? (
            <Typography
              className={"t-minor"}
              ellipsis
              level={"body2"}
              title={format_date(connection.created_at, DateFormat.STANDARD)}
            >
              {PROVIDER_DISPLAY_NAME_MAP[connection.provider]}{" "}
              <span className={"t-muted"}>&bull;</span> Connected{" "}
              {format_date(connection.created_at, DateFormat.RELATIVE)}
            </Typography>
          ) : (
            <Typography className={"t-minor"} level={"body2"}>
              Not connected
            </Typography>
          )}
        </div>
      </div>
      <div className={clsx("flex-center", styles.actions)}>
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
        <Typography className={"t-minor"} level={"body2"}>
          Link your social media accounts to display them on your public
          profile. We use this data for display purposes only and comply with
          our{" "}
          <Link href={"/privacy"} target={"_blank"} underline={"always"}>
            Privacy Policy
          </Link>{" "}
          by not sharing it outside of Storiny.
          <br />
          <br />
          Note that social media providers operate independently and linking to
          Storiny implies agreeing to their terms and privacy policy.
          <br />
          <br />
          To delete all your social media data, disconnect your social account
          from this page. If you want to temporarily hide your social media
          account on your profile, you can use the &quot;Hide&quot; button.
        </Typography>
        <Spacer orientation={"vertical"} size={5} />
        <ul className={clsx("flex-col", styles.list)}>
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
