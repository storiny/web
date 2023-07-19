import "./UserList.scss";

import clsx from "clsx";
import React from "react";

import { AppState, Collaborator } from "../../core/types";
import { useExcalidrawActionManager } from "./App";
import { Tooltip } from "./Tooltip";

export const UserList: React.FC<{
  className?: string;
  collaborators: AppState["collaborators"];
  mobile?: boolean;
}> = ({ className, mobile, collaborators }) => {
  const actionManager = useExcalidrawActionManager();

  const uniqueCollaborators = new Map<string, Collaborator>();
  collaborators.forEach((collaborator, socketId) => {
    uniqueCollaborators.set(
      // filter on user id, else fall back on unique socketId
      collaborator.id || socketId,
      collaborator
    );
  });

  const avatars =
    uniqueCollaborators.size > 0 &&
    Array.from(uniqueCollaborators)
      .filter(([_, client]) => Object.keys(client).length !== 0)
      .map(([clientId, collaborator]) => {
        const avatarJSX = actionManager.renderAction("goToCollaborator", [
          clientId,
          collaborator
        ]);

        return mobile ? (
          <Tooltip
            key={clientId}
            label={collaborator.username || "Unknown user"}
          >
            {avatarJSX}
          </Tooltip>
        ) : (
          <React.Fragment key={clientId}>{avatarJSX}</React.Fragment>
        );
      });

  return (
    <div className={clsx("UserList", className, { UserList_mobile: mobile })}>
      {avatars}
    </div>
  );
};
