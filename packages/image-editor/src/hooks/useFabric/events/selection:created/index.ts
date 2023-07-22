import { BaseFabricObject, Canvas } from "fabric";

import {
  editorStore,
  mutateLayer,
  selectLayers,
  setLayerSelected
} from "../../../../store";
import { Layer } from "../../../../types";

export const selectionCreatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:created", (options) => {
    const objects = options.selected;

    objects.forEach((object) => {
      editorStore.dispatch(setLayerSelected([object.get("id"), true]));
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
