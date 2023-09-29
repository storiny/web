import NextLink from "next/link";
import React from "react";

import Button from "../../../../../../../../../../../../../packages/ui/src/components/button";
import { use_confirmation } from "../../../../../../../../../../../../../packages/ui/src/components/confirmation";
import { use_toast } from "../../../../../../../../../../../../../packages/ui/src/components/toast";
import { use_remove_connection_mutation } from "~/redux/features";

import {
  providerDisplayNameMap,
  providerIconMap,
  providerKeyMap
} from "../../../../../../../../../providers";
import { ConnectionButtonProps } from "./connection-button.props";

const ConnectionButton = ({
  connection,
  provider,
  onRemove
}: ConnectionButtonProps): React.ReactElement => {
  const toast = use_toast();
  const [connected, setConnected] = React.useState<boolean>(
    Boolean(connection)
  );
  const [removeConnection, { isLoading }] = use_remove_connection_mutation();
  const displayName = providerDisplayNameMap[connection?.provider || 0];

  /**
   * Handles confirmation
   */
  const handleConfirm = (): void => {
    if (connection) {
      removeConnection({ id: connection.id })
        .unwrap()
        .then(() => {
          onRemove();
          setConnected(false);
          toast("Connection removed", "success");
        })
        .catch((e) => {
          setConnected(true);
          toast(e?.data?.error || "Could not remove your connection", "error");
        });
    }
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        auto_size
        check_auth
        color={"ruby"}
        disabled={isLoading}
        onClick={open_confirmation}
        variant={"hollow"}
      >
        Disconnect
      </Button>
    ),
    connection
      ? {
          on_confirm: handleConfirm,
          decorator: React.createElement(providerIconMap[connection.provider]),
          title: `Disconnect ${displayName}?`,
          description: `Your ${displayName} details will be deleted, and your ${displayName} account will not be displayed on your profile until you link it again.`
        }
      : { title: "", description: "" }
  );

  return connected ? (
    element
  ) : (
    <Button
      as={NextLink}
      auto_size
      check_auth
      href={`/api/oauth/${providerKeyMap[provider]}`}
    >
      Connect
    </Button>
  );
};

export default ConnectionButton;
