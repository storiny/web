import { BaseFabricObject, Canvas } from "fabric";

import {
  editorStore,
  mutateLayer,
  selectLayers,
  setLayerSelected
} from "../../../../store";
import { Layer } from "../../../../types";

export const selectionUpdatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:updated", (options) => {
    const { selected, deselected } = options;

    selected.forEach((object) => {
      editorStore.dispatch(setLayerSelected([object.get("id"), true]));
    });

    deselected.forEach((object) => {
      editorStore.dispatch(setLayerSelected([object.get("id"), false]));
    });
  });

  // editorStore.subscribe(() => {
  //   const layers = selectLayers(editorStore.getState());
  //
  //   canvas.getObjects().forEach((object) => {
  //     layers.some((layer) =>
  //       layer.id === (object as any).id
  //         ? syncFabricObjectToLayer(object, layer)
  //         : undefined
  //     );
  //   });
  // });
};
