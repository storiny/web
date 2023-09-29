import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Avatar from "../../../../../../ui/src/components/avatar";
import AvatarGroup from "../../../../../../ui/src/components/avatar-group";
import Divider from "../../../../../../ui/src/components/divider";
import Tooltip from "../../../../../../ui/src/components/tooltip";
import { use_media_query } from "../../../../../../ui/src/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { capitalize } from "~/utils/capitalize";

import { awarenessAtom } from "../../../../atoms";
import { UserState } from "../../../../collaboration/provider";
import styles from "./presence.module.scss";

type UserStateWithClientId = UserState & { clientID: number };

// Participant

const Participant = ({
  presence
}: {
  presence: UserState;
}): React.ReactElement => (
  <Tooltip content={presence.name} right_slot={capitalize(presence.role)}>
    <Avatar
      alt={""}
      avatar_id={presence.avatar_id}
      className={clsx(
        styles.x,
        styles.participant,
        presence.role === "viewer" && styles.viewer,
        presence.focusing && styles.focusing
      )}
      hex={presence.avatarHex}
      label={presence.name}
      style={{ "--color": presence.color } as React.CSSProperties}
    />
  </Tooltip>
);

const EditorPresence = (): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const awareness = use_atom_value(awarenessAtom);
  const [editors, setEditors] = React.useState<UserStateWithClientId[]>([]);
  const [viewers, setViewers] = React.useState<UserStateWithClientId[]>([]);

  React.useEffect(() => {
    const updatePresences = (): void => {
      if (awareness) {
        const presences = Array.from(awareness.getStates().entries())
          .filter(([clientID]) => clientID !== awareness.clientID)
          .map(([clientID, value]) => ({
            ...value,
            clientID
          })) as UserStateWithClientId[];

        setEditors(presences.filter((presence) => presence.role === "editor"));
        setViewers(presences.filter((presence) => presence.role === "viewer"));
      }
    };

    if (awareness) {
      awareness.on("update", updatePresences);
    }

    return () => {
      if (awareness) {
        awareness.off("update", updatePresences);
      }
    };
  }, [awareness]);

  return (
    <div className={clsx("flex-center", styles.x, styles.presence)}>
      {editors.map((editor) => (
        <Participant key={String(editor.clientID)} presence={editor} />
      ))}
      {!is_smaller_than_tablet && viewers.length ? (
        <React.Fragment>
          <Divider orientation={"vertical"} />
          <AvatarGroup>
            {viewers.map((viewer) => (
              <Participant key={String(viewer.clientID)} presence={viewer} />
            ))}
          </AvatarGroup>
        </React.Fragment>
      ) : null}
    </div>
  );
};

export default EditorPresence;
