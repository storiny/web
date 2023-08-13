import React from "react";

import Button from "~/components/Button";
import { useToast } from "~/components/Toast";
import { useConnectionVisibilityMutation } from "~/redux/features";

import { VisibilityButtonProps } from "./visibility-button.props";

const VisibilityButton = ({
  connection
}: VisibilityButtonProps): React.ReactElement => {
  const toast = useToast();
  const [hidden, setHidden] = React.useState<boolean>(
    Boolean(connection.hidden)
  );
  const [connectionVisibility, { isLoading }] =
    useConnectionVisibilityMutation();

  /**
   * Handles visibility mutations
   */
  const handleVisibility = (): void => {
    connectionVisibility({ id: connection.id, visible: hidden })
      .unwrap()
      .then(() => setHidden((prevState) => !prevState))
      .catch((e) =>
        toast(e?.data?.error || "Could not change your connection settings")
      );
  };

  return (
    <Button
      autoSize
      disabled={isLoading}
      onClick={handleVisibility}
      variant={hidden ? "rigid" : "hollow"}
    >
      {hidden ? "Unhide" : "Hide"}
    </Button>
  );
};

export default VisibilityButton;
