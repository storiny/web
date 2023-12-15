import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import { use_toast } from "~/components/toast";
import { use_remove_connection_mutation } from "~/redux/features";
import { handle_api_error } from "~/utils/handle-api-error";

import {
  PROVIDER_DISPLAY_NAME_MAP,
  PROVIDER_ICON_MAP,
  PROVIDER_KEY_MAP
} from "../../../../../../../../../(alpha)/providers";
import { ConnectionButtonProps } from "./connection-button.props";

const ConnectionButton = ({
  connection,
  provider,
  on_remove
}: ConnectionButtonProps): React.ReactElement => {
  const toast = use_toast();
  const [connected, set_connected] = React.useState<boolean>(
    Boolean(connection)
  );
  const [remove_connection, { isLoading: is_loading }] =
    use_remove_connection_mutation();
  const display_name = PROVIDER_DISPLAY_NAME_MAP[connection?.provider || 0];

  /**
   * Handles confirmation
   */
  const handle_confirm = (): void => {
    if (connection) {
      remove_connection({ id: connection.id })
        .unwrap()
        .then(() => {
          on_remove();
          set_connected(false);
          toast("Connection removed", "success");
        })
        .catch((error) => {
          set_connected(true);

          handle_api_error(
            error,
            toast,
            null,
            "Could not remove your connection"
          );
        });
    }
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        auto_size
        check_auth
        color={"ruby"}
        disabled={is_loading}
        onClick={open_confirmation}
        variant={"hollow"}
      >
        Disconnect
      </Button>
    ),
    connection
      ? {
          on_confirm: handle_confirm,
          decorator: React.createElement(
            PROVIDER_ICON_MAP[connection.provider]
          ),
          title: `Disconnect ${display_name}?`,
          description: `Your ${display_name} details will be deleted, and your ${display_name} account will not be displayed on your profile until you link it again.`
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
      href={`${process.env.NEXT_PUBLIC_API_URL}/oauth/${PROVIDER_KEY_MAP[provider]}`}
    >
      Connect
    </Button>
  );
};

export default ConnectionButton;
