import React from "react";

import Button from "../../../../../../../../../../../../../packages/ui/src/components/button";
import { use_toast } from "../../../../../../../../../../../../../packages/ui/src/components/toast";
import { use_connection_visibility_mutation } from "~/redux/features";

import { VisibilityButtonProps } from "./visibility-button.props";

const VisibilityButton = ({
  connection
}: VisibilityButtonProps): React.ReactElement => {
  const toast = use_toast();
  const [hidden, setHidden] = React.useState<boolean>(
    Boolean(connection.hidden)
  );
  const [mutateConnectionVisibility, { isLoading }] =
    use_connection_visibility_mutation();

  /**
   * Handles visibility mutations
   */
  const handleVisibility = (): void => {
    mutateConnectionVisibility({ id: connection.id, visible: hidden })
      .unwrap()
      .then(() => setHidden((prev_state) => !prev_state))
      .catch((e) =>
        toast(e?.data?.error || "Could not change your connection settings")
      );
  };

  return (
    <Button
      auto_size
      check_auth
      disabled={isLoading}
      onClick={handleVisibility}
      variant={hidden ? "rigid" : "hollow"}
    >
      {hidden ? "Unhide" : "Hide"}
    </Button>
  );
};

export default VisibilityButton;
