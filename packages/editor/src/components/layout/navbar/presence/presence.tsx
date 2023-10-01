import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Avatar from "~/components/avatar";
import AvatarGroup from "~/components/avatar-group";
import Divider from "~/components/divider";
import Tooltip from "~/components/tooltip";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { capitalize } from "~/utils/capitalize";

import { awareness_atom } from "../../../../atoms";
import { UserState } from "../../../../collaboration/provider";
import styles from "./presence.module.scss";

type UserStateWithClientId = UserState & { client_id: number };

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
      hex={presence.avatar_hex}
      label={presence.name}
      style={{ "--color": presence.color } as React.CSSProperties}
    />
  </Tooltip>
);

const EditorPresence = (): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const awareness = use_atom_value(awareness_atom);
  const [editors, set_editors] = React.useState<UserStateWithClientId[]>([]);
  const [viewers, set_viewers] = React.useState<UserStateWithClientId[]>([]);

  React.useEffect(() => {
    const update_presences = (): void => {
      if (awareness) {
        const presences = Array.from(awareness.getStates().entries())
          .filter(([client_id]) => client_id !== awareness.clientID)
          .map(([client_id, value]) => ({
            ...value,
            client_id
          })) as UserStateWithClientId[];

        set_editors(presences.filter((presence) => presence.role === "editor"));
        set_viewers(presences.filter((presence) => presence.role === "viewer"));
      }
    };

    if (awareness) {
      awareness.on("update", update_presences);
    }

    return () => {
      if (awareness) {
        awareness.off("update", update_presences);
      }
    };
  }, [awareness]);

  return (
    <div className={clsx("flex-center", styles.x, styles.presence)}>
      {editors.map((editor) => (
        <Participant key={String(editor.client_id)} presence={editor} />
      ))}
      {!is_smaller_than_tablet && viewers.length ? (
        <React.Fragment>
          <Divider orientation={"vertical"} />
          <AvatarGroup>
            {viewers.map((viewer) => (
              <Participant key={String(viewer.client_id)} presence={viewer} />
            ))}
          </AvatarGroup>
        </React.Fragment>
      ) : null}
    </div>
  );
};

export default EditorPresence;
