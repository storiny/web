import { isTextLayer, refreshTextDimensions } from "../../core/layer";
import { newLayerWith } from "../../core/layer/mutateLayer";
import { isBoundToContainer } from "../../core/layer/typeChecks";
import { ExcalidrawLayer, ExcalidrawTextLayer } from "../../core/layer/types";
import { invalidateShapeForLayer } from "../../core/renderer/renderLayer";
import { getFontString } from "../../core/utils";
import type Scene from "./Scene";

export class Fonts {
  private scene: Scene;
  private onSceneUpdated: () => void;

  constructor({
    scene,
    onSceneUpdated
  }: {
    onSceneUpdated: () => void;
    scene: Scene;
  }) {
    this.scene = scene;
    this.onSceneUpdated = onSceneUpdated;
  }

  // it's ok to track fonts across multiple instances only once, so let's use
  // a static member to reduce memory footprint
  private static loadedFontFaces = new Set<string>();

  /**
   * if we load a (new) font, it's likely that text layers using it have
   * already been rendered using a fallback font. Thus, we want invalidate
   * their shapes and rerender. See #637.
   *
   * Invalidates text layers and rerenders scene, provided that at least one
   * of the supplied fontFaces has not already been processed.
   */
  public onFontsLoaded = (fontFaces: readonly FontFace[]) => {
    if (
      // bail if all fonts with have been processed. We're checking just a
      // subset of the font properties (though it should be enough), so it
      // can technically bail on a false positive.
      fontFaces.every((fontFace) => {
        const sig = `${fontFace.family}-${fontFace.style}-${fontFace.weight}`;
        if (Fonts.loadedFontFaces.has(sig)) {
          return true;
        }
        Fonts.loadedFontFaces.add(sig);
        return false;
      })
    ) {
      return false;
    }

    let didUpdate = false;

    this.scene.mapLayers((layer) => {
      if (isTextLayer(layer) && !isBoundToContainer(layer)) {
        invalidateShapeForLayer(layer);
        didUpdate = true;
        return newLayerWith(layer, {
          ...refreshTextDimensions(layer)
        });
      }
      return layer;
    });

    if (didUpdate) {
      this.onSceneUpdated();
    }
  };

  public loadFontsForLayers = async (layers: readonly ExcalidrawLayer[]) => {
    const fontFaces = await Promise.all(
      [
        ...new Set(
          layers
            .filter((layer) => isTextLayer(layer))
            .map((layer) => (layer as ExcalidrawTextLayer).fontFamily)
        )
      ].map((fontFamily) => {
        const fontString = getFontString({
          fontFamily,
          fontSize: 16
        });
        if (!document.fonts?.check?.(fontString)) {
          return document.fonts?.load?.(fontString);
        }
        return undefined;
      })
    );
    this.onFontsLoaded(fontFaces.flat().filter(Boolean) as FontFace[]);
  };
}
