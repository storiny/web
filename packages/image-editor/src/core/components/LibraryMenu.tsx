import "./LibraryMenu.scss";

import { atom, useAtom } from "jotai";
import React, { useCallback, useMemo, useRef, useState } from "react";

import Library, {
  distributeLibraryItemsOnSquareGrid,
  libraryItemsAtom
} from "../../lib/data/library";
import { getSelectedLayers } from "../../lib/scene";
import { isShallowEqual } from "../../lib/utils/utils";
import { trackEvent } from "../analytics";
import { useUIAppState } from "../context/ui-editorState";
import { t } from "../i18n";
import { jotaiScope } from "../jotai";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { randomId } from "../random";
import {
  ExcalidrawProps,
  LibraryItem,
  LibraryItems,
  UIAppState
} from "../types";
import {
  useApp,
  useAppProps,
  useExcalidrawLayers,
  useExcalidrawSetAppState
} from "./App";
import { LibraryMenuControlButtons } from "./LibraryMenuControlButtons";
import LibraryMenuItems from "./LibraryMenuItems";
import Spinner from "./Spinner";

export const isLibraryMenuOpenAtom = atom(false);

const LibraryMenuWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="layer-ui__library">{children}</div>
);

export const LibraryMenuContent = ({
  onInsertLibraryItems,
  pendingLayers,
  onAddToLibrary,
  setAppState,
  libraryReturnUrl,
  library,
  id,
  theme,
  selectedItems,
  onSelectItems
}: {
  id: string;
  library: Library;
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  onAddToLibrary: () => void;
  onInsertLibraryItems: (libraryItems: LibraryItems) => void;
  onSelectItems: (id: LibraryItem["id"][]) => void;
  pendingLayers: LibraryItem["layers"];
  selectedItems: LibraryItem["id"][];
  setAppState: React.Component<any, UIAppState>["setState"];
  theme: UIAppState["theme"];
}) => {
  const [libraryItemsData] = useAtom(libraryItemsAtom, jotaiScope);

  const _onAddToLibrary = useCallback(
    (layers: LibraryItem["layers"]) => {
      const addToLibrary = async (
        processedLayers: LibraryItem["layers"],
        libraryItems: LibraryItems
      ) => {
        trackEvent("layer", "addToLibrary", "ui");
        if (processedLayers.some((layer) => layer.type === "image")) {
          return setAppState({
            errorMessage:
              "Support for adding images to the library coming soon!"
          });
        }
        const nextItems: LibraryItems = [
          {
            status: "unpublished",
            layers: processedLayers,
            id: randomId(),
            created: Date.now()
          },
          ...libraryItems
        ];
        onAddToLibrary();
        library.setLibrary(nextItems).catch(() => {
          setAppState({ errorMessage: t("alerts.errorAddingToLibrary") });
        });
      };
      addToLibrary(layers, libraryItemsData.libraryItems);
    },
    [onAddToLibrary, library, setAppState, libraryItemsData.libraryItems]
  );

  const libraryItems = useMemo(
    () => libraryItemsData.libraryItems,
    [libraryItemsData]
  );

  if (
    libraryItemsData.status === "loading" &&
    !libraryItemsData.isInitialized
  ) {
    return (
      <LibraryMenuWrapper>
        <div className="layer-ui__library-message">
          <div>
            <Spinner size="2em" />
            <span>{t("labels.libraryLoadingMessage")}</span>
          </div>
        </div>
      </LibraryMenuWrapper>
    );
  }

  const showBtn =
    libraryItemsData.libraryItems.length > 0 || pendingLayers.length > 0;

  return (
    <LibraryMenuWrapper>
      <LibraryMenuItems
        id={id}
        isLoading={libraryItemsData.status === "loading"}
        libraryItems={libraryItems}
        libraryReturnUrl={libraryReturnUrl}
        onAddToLibrary={_onAddToLibrary}
        onInsertLibraryItems={onInsertLibraryItems}
        onSelectItems={onSelectItems}
        pendingLayers={pendingLayers}
        selectedItems={selectedItems}
        theme={theme}
      />
      {showBtn && (
        <LibraryMenuControlButtons
          className="library-menu-control-buttons--at-bottom"
          id={id}
          libraryReturnUrl={libraryReturnUrl}
          style={{ padding: "16px 12px 0 12px" }}
          theme={theme}
        />
      )}
    </LibraryMenuWrapper>
  );
};

const usePendingLayersMemo = (
  editorState: UIAppState,
  layers: readonly NonDeletedExcalidrawLayer[]
) => {
  const create = () =>
    getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: true,
      includeLayersInFrames: true
    });
  const val = useRef(create());
  const prevAppState = useRef<UIAppState>(editorState);
  const prevLayers = useRef(layers);

  if (
    !isShallowEqual(
      editorState.selectedLayerIds,
      prevAppState.current.selectedLayerIds
    ) ||
    !isShallowEqual(layers, prevLayers.current)
  ) {
    val.current = create();
    prevAppState.current = editorState;
    prevLayers.current = layers;
  }
  return val.current;
};

/**
 * This component is meant to be rendered inside <Sidebar.Tab/> inside our
 * <DefaultSidebar/> or host apps Sidebar components.
 */
export const LibraryMenu = () => {
  const { library, id, onInsertLayers } = useApp();
  const appProps = useAppProps();
  const editorState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();
  const layers = useExcalidrawLayers();
  const [selectedItems, setSelectedItems] = useState<LibraryItem["id"][]>([]);
  const memoizedLibrary = useMemo(() => library, [library]);
  // BUG: pendingLayers are still causing some unnecessary rerenders because clicking into canvas returns some ids even when no layer is selected.
  const pendingLayers = usePendingLayersMemo(editorState, layers);

  const onInsertLibraryItems = useCallback(
    (libraryItems: LibraryItems) => {
      onInsertLayers(distributeLibraryItemsOnSquareGrid(libraryItems));
    },
    [onInsertLayers]
  );

  const deselectItems = useCallback(() => {
    setAppState({
      selectedLayerIds: {},
      selectedGroupIds: {}
    });
  }, [setAppState]);

  return (
    <LibraryMenuContent
      id={id}
      library={memoizedLibrary}
      libraryReturnUrl={appProps.libraryReturnUrl}
      onAddToLibrary={deselectItems}
      onInsertLibraryItems={onInsertLibraryItems}
      onSelectItems={setSelectedItems}
      pendingLayers={pendingLayers}
      selectedItems={selectedItems}
      setAppState={setAppState}
      theme={editorState.theme}
    />
  );
};
