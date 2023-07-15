import "./LiveCollaborationTrigger.scss";

import clsx from "clsx";

import { useUIAppState } from "../../context/ui-appState";
import { t } from "../../i18n";
import { Button } from "../Button";
import { usersIcon } from "../icons";

const LiveCollaborationTrigger = ({
  isCollaborating,
  onSelect,
  ...rest
}: {
  isCollaborating: boolean;
  onSelect: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonLayer>) => {
  const appState = useUIAppState();

  return (
    <Button
      {...rest}
      className={clsx("collab-button", { active: isCollaborating })}
      onSelect={onSelect}
      style={{ position: "relative" }}
      title={t("labels.liveCollaboration")}
      type="button"
    >
      {usersIcon}
      {appState.collaborators.size > 0 && (
        <div className="CollabButton-collaborators">
          {appState.collaborators.size}
        </div>
      )}
    </Button>
  );
};

export default LiveCollaborationTrigger;
LiveCollaborationTrigger.displayName = "LiveCollaborationTrigger";
