import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import { useConfirmation } from "~/components/Confirmation";
import { useToast } from "~/components/Toast";
import { useRemoveConnectionMutation } from "~/redux/features";

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
  const toast = useToast();
  const [connected, setConnected] = React.useState<boolean>(
    Boolean(connection)
  );
  const [removeConnection, { isLoading }] = useRemoveConnectionMutation();
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

  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <Button
        autoSize
        checkAuth
        color={"ruby"}
        disabled={isLoading}
        onClick={openConfirmation}
        variant={"hollow"}
      >
        Disconnect
      </Button>
    ),
    connection
      ? {
          onConfirm: handleConfirm,
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
      autoSize
      checkAuth
      href={`/api/oauth/${providerKeyMap[provider]}`}
    >
      Connect
    </Button>
  );
};

export default ConnectionButton;
