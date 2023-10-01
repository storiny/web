import React from "react";

import Button from "~/components/button";
import { use_toast } from "~/components/toast";
import { use_connection_visibility_mutation } from "~/redux/features";

import { VisibilityButtonProps } from "./visibility-button.props";

const VisibilityButton = ({
  connection
}: VisibilityButtonProps): React.ReactElement => {
  const toast = use_toast();
  const [hidden, set_hidden] = React.useState<boolean>(
    Boolean(connection.hidden)
  );
  const [mutate_connection_visibility, { isLoading: is_loading }] =
    use_connection_visibility_mutation();

  /**
   * Handles visibility mutations
   */
  const handle_visibility = (): void => {
    mutate_connection_visibility({ id: connection.id, visible: hidden })
      .unwrap()
      .then(() => set_hidden((prev_state) => !prev_state))
      .catch((e) =>
        toast(e?.data?.error || "Could not change your connection settings")
      );
  };

  return (
    <Button
      auto_size
      check_auth
      disabled={is_loading}
      onClick={handle_visibility}
      variant={hidden ? "rigid" : "hollow"}
    >
      {hidden ? "Unhide" : "Hide"}
    </Button>
  );
};

export default VisibilityButton;
