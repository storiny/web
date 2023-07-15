import { atom, useAtom } from "jotai";
import { useEffect, useState } from "react";

import { COLOR_PALETTE } from "../../core/colors";
import { jotaiScope } from "../../core/jotai";
import { LibraryItem } from "../../core/types";
import { exportToSvg } from "../packages/utils";

export type SvgCache = Map<LibraryItem["id"], SVGSVGLayer>;

export const libraryItemSvgsCache = atom<SvgCache>(new Map());

const exportLibraryItemToSvg = async (layers: LibraryItem["layers"]) =>
  await exportToSvg({
    layers,
    appState: {
      exportBackground: false,
      viewBackgroundColor: COLOR_PALETTE.white
    },
    files: null
  });

export const useLibraryItemSvg = (
  id: LibraryItem["id"] | null,
  layers: LibraryItem["layers"] | undefined,
  svgCache: SvgCache
): SVGSVGLayer | undefined => {
  const [svg, setSvg] = useState<SVGSVGLayer>();

  useEffect(() => {
    if (layers) {
      if (id) {
        // Try to load cached svg
        const cachedSvg = svgCache.get(id);

        if (cachedSvg) {
          setSvg(cachedSvg);
        } else {
          // When there is no svg in cache export it and save to cache
          (async () => {
            const exportedSvg = await exportLibraryItemToSvg(layers);
            exportedSvg.querySelector(".style-fonts")?.remove();

            if (exportedSvg) {
              svgCache.set(id, exportedSvg);
              setSvg(exportedSvg);
            }
          })();
        }
      } else {
        // When we have no id (usualy selected items from canvas) just export the svg
        (async () => {
          const exportedSvg = await exportLibraryItemToSvg(layers);
          setSvg(exportedSvg);
        })();
      }
    }
  }, [id, layers, svgCache, setSvg]);

  return svg;
};

export const useLibraryCache = () => {
  const [svgCache] = useAtom(libraryItemSvgsCache, jotaiScope);

  const clearLibraryCache = () => svgCache.clear();

  const deleteItemsFromLibraryCache = (items: LibraryItem["id"][]) => {
    items.forEach((item) => svgCache.delete(item));
  };

  return {
    clearLibraryCache,
    deleteItemsFromLibraryCache,
    svgCache
  };
};
