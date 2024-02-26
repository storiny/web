import { clsx } from "clsx";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import IconButton from "~/components/icon-button";
import css from "~/theme/main.module.scss";

import {
  PROVIDER_DISPLAY_NAME_MAP,
  PROVIDER_ICON_MAP
} from "../../../../providers";
import styles from "./connections.module.scss";

interface Props {
  connections: GetProfileResponse["connections"];
  is_inside_sidebar?: boolean;
}

const Connections = ({
  connections,
  is_inside_sidebar
}: Props): React.ReactElement => (
  <div className={clsx(css.flex, styles.connections)}>
    {connections.map((connection) =>
      !PROVIDER_DISPLAY_NAME_MAP[connection.provider] ||
      !PROVIDER_ICON_MAP[connection.provider] ? null : (
        <IconButton
          aria-label={`${connection.display_name} on ${
            PROVIDER_DISPLAY_NAME_MAP[connection.provider]
          }`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={connection.url}
          key={connection.provider}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${connection.display_name} on ${
            PROVIDER_DISPLAY_NAME_MAP[connection.provider]
          }`}
          variant={"ghost"}
        >
          {React.createElement(PROVIDER_ICON_MAP[connection.provider])}
        </IconButton>
      )
    )}
  </div>
);

export default Connections;
