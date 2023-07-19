import { Layer, TextLayer } from "../../../types";
import {
  isBoundToContainer,
  isTextLayer,
  newLayerWith,
  refreshTextDimensions
} from "../../layer";
import { invalidateShapeForLayer } from "../../renderer";
import { getFontString } from "../../utils";
import { Scene } from "../scene";

export class Fonts {
  private scene: Scene;
  private readonly onSceneUpdated: () => void;
  // Static member to reduce memory footprint across multiple instances
  private static loadedFontFaces = new Set<string>();

  /**
   * Ctor
   * @param scene Scene
   * @param onSceneUpdated Callback function called when the scene gets updated
   */
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

  /**
   * Invalidates text layers and rerenders scene, providede that at least one
   * of the supplied fontFaces has not already been processed. Required as when
   * a new font is loaded, it's likely that text layers using it have already
   * been rendered using a fallback font, this we need to invalidate their
   * shapes and perform a rerender
   * @param fontFaces Font faces
   */
  public onFontsLoaded = (
    fontFaces: readonly FontFace[]
  ): boolean | undefined => {
    if (
      // Bail out if all the fonts have been processed. We're checking just a
      // subset of the font properties (though it should be enough), so it
      // can technically bail on a false positive
      fontFaces.every((fontFace) => {
        const signature = `${fontFace.family}:${fontFace.style}:${fontFace.weight}`;

        if (Fonts.loadedFontFaces.has(signature)) {
          return true;
        }

        Fonts.loadedFontFaces.add(signature);

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

  /**
   * Loads fonts for layers
   * @param layers Layers
   */
  public loadFontsForLayers = async (
    layers: readonly Layer[]
  ): Promise<void> => {
    const fontFaces = await Promise.all(
      [
        ...new Set(
          layers
            .filter(isTextLayer)
            .map((layer) => (layer as TextLayer).fontFamily)
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
