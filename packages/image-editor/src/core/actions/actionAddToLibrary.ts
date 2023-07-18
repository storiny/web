import { getSelectedLayers } from "../../lib/scene";
import { t } from "../i18n";
import { getNonDeletedLayers } from "../layer";
import { deepCopyLayer } from "../layer/newLayer";
import { randomId } from "../random";
import { register } from "./register";

export const actionAddToLibrary = register({
  name: "addToLibrary",
  trackEvent: { category: "layer" },
  perform: (layers, editorState, _, app) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      editorState,
      {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      }
    );
    if (selectedLayers.some((layer) => layer.type === "image")) {
      return {
        commitToHistory: false,
        editorState: {
          ...editorState,
          errorMessage: "Support for adding images to the library coming soon!"
        }
      };
    }

    return app.library
      .getLatestLibrary()
      .then((items) =>
        app.library.setLibrary([
          {
            id: randomId(),
            status: "unpublished",
            layers: selectedLayers.map(deepCopyLayer),
            created: Date.now()
          },
          ...items
        ])
      )
      .then(() => ({
        commitToHistory: false,
        editorState: {
          ...editorState,
          toast: { message: t("toast.addedToLibrary") }
        }
      }))
      .catch((error) => ({
        commitToHistory: false,
        editorState: {
          ...editorState,
          errorMessage: error.message
        }
      }));
  },
  contextItemLabel: "labels.addToLibrary"
});
