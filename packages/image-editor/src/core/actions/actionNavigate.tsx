import { centerScrollOn } from "../../lib/scene/scroll/scroll";
import { getClientColor } from "../clients";
import { Avatar } from "../components/Avatar";
import { Collaborator } from "../types";
import { register } from "./register";

export const actionGoToCollaborator = register({
  name: "goToCollaborator",
  viewMode: true,
  trackEvent: { category: "collab" },
  perform: (_layers, editorState, value) => {
    const point = value as Collaborator["pointer"];
    if (!point) {
      return { editorState, commitToHistory: false };
    }

    return {
      editorState: {
        ...editorState,
        ...centerScrollOn({
          scenePoint: point,
          viewportDimensions: {
            width: editorState.width,
            height: editorState.height
          },
          zoom: editorState.zoom
        }),
        // Close mobile menu
        openMenu:
          editorState.openMenu === "canvas" ? null : editorState.openMenu
      },
      commitToHistory: false
    };
  },
  PanelComponent: ({ updateData, data }) => {
    const [clientId, collaborator] = data as [string, Collaborator];

    const background = getClientColor(clientId);

    return (
      <Avatar
        color={background}
        name={collaborator.username || ""}
        onClick={() => updateData(collaborator.pointer)}
        src={collaborator.avatarUrl}
      />
    );
  }
});
