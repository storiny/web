import "./LiveCollaborationTrigger.scss";

import clsx from "clsx";

import { useUIAppState } from "../../context/ui-editorState";
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
  const editorState = useUIAppState();

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
      {editorState.collaborators.size > 0 && (
        <div className="CollabButton-collaborators">
          {editorState.collaborators.size}
        </div>
      )}
    </Button>
  );
};

export default LiveCollaborationTrigger;
LiveCollaborationTrigger.displayName = "LiveCollaborationTrigger";
