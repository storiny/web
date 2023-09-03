import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Avatar from "~/components/Avatar";
import AvatarGroup from "~/components/AvatarGroup";
import Divider from "~/components/Divider";
import Tooltip from "~/components/Tooltip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";
import { capitalize } from "~/utils/capitalize";

import { awarenessAtom } from "../../../../atoms";
import { UserState } from "../../../../collab/provider";
import styles from "./presence.module.scss";

type UserStateWithClientId = UserState & { clientID: number };

// Participant

const Participant = ({
  presence
}: {
  presence: UserState;
}): React.ReactElement => (
  <Tooltip content={presence.name} rightSlot={capitalize(presence.role)}>
    <Avatar
      alt={""}
      avatarId={presence.avatarId}
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
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const awareness = useAtomValue(awarenessAtom);
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
      {!isSmallerThanTablet && viewers.length ? (
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
