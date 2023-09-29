import { clsx } from "clsx";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import IconButton from "../../../../../../../packages/ui/src/components/icon-button";

import styles from "./connections.module.scss";

interface Props {
  connections: GetProfileResponse["connections"];
  isInsideSidebar?: boolean;
  name: string;
}

import { providerDisplayNameMap, providerIconMap } from "../../../providers";

const Connections = ({
  connections,
  name,
  isInsideSidebar
}: Props): React.ReactElement => (
  <div className={clsx("flex", styles.x, styles.connections)}>
    {connections.map((connection) => (
      <IconButton
        aria-label={`${name} on ${providerDisplayNameMap[connection.provider]}`}
        as={"a"}
        className={clsx(styles.x, styles.connection)}
        href={connection.url}
        key={connection.provider}
        rel={"noreferrer"}
        size={isInsideSidebar ? "md" : "lg"}
        target={"_blank"}
        title={`${name} on ${providerDisplayNameMap[connection.provider]}`}
        variant={"ghost"}
      >
        {React.createElement(providerIconMap[connection.provider])}
      </IconButton>
    ))}
  </div>
);

export default Connections;
