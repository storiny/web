import { getSelectedLayers } from "../../lib/scene";
import { t } from "../i18n";
import { getNonDeletedLayers } from "../layer";
import { deepCopyLayer } from "../layer/newLayer";
import { randomId } from "../random";
import { register } from "./register";

export const actionAddToLibrary = register({
  name: "addToLibrary",
  trackEvent: { category: "layer" },
  perform: (layers, appState, _, app) => {
    const selectedLayers = getSelectedLayers(
      getNonDeletedLayers(layers),
      appState,
      {
        includeBoundTextLayer: true,
        includeLayersInFrames: true
      }
    );
    if (selectedLayers.some((layer) => layer.type === "image")) {
      return {
        commitToHistory: false,
        appState: {
          ...appState,
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
        appState: {
          ...appState,
          toast: { message: t("toast.addedToLibrary") }
        }
      }))
      .catch((error) => ({
        commitToHistory: false,
        appState: {
          ...appState,
          errorMessage: error.message
        }
      }));
  },
  contextItemLabel: "labels.addToLibrary"
});
