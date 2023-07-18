import "./LibraryMenuItems.scss";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { serializeLibraryAsJSON } from "../../lib/data/json/json";
import { useLibraryCache } from "../../lib/hooks/useLibraryItemSvg";
import { useScrollPosition } from "../../lib/hooks/useScrollPosition/useScrollPosition";
import { arrayToMap } from "../../lib/utils/utils";
import { MIME_TYPES } from "../constants";
import { t } from "../i18n";
import { duplicateLayers } from "../layer/newLayer";
import {
  ExcalidrawProps,
  LibraryItem,
  LibraryItems,
  UIAppState
} from "../types";
import { LibraryMenuControlButtons } from "./LibraryMenuControlButtons";
import { LibraryDropdownMenu } from "./LibraryMenuHeaderContent";
import {
  LibraryMenuSection,
  LibraryMenuSectionGrid
} from "./LibraryMenuSection";
import Spinner from "./Spinner";
import Stack from "./Stack";

// using an odd number of items per batch so the rendering creates an irregular
// pattern which looks more organic
const ITEMS_RENDERED_PER_BATCH = 17;
// when render outputs cached we can render many more items per batch to
// speed it up
const CACHED_ITEMS_RENDERED_PER_BATCH = 64;

export default ({
  isLoading,
  libraryItems,
  onAddToLibrary,
  onInsertLibraryItems,
  pendingLayers,
  theme,
  id,
  libraryReturnUrl,
  onSelectItems,
  selectedItems
}: {
  id: string;
  isLoading: boolean;
  libraryItems: LibraryItems;
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  onAddToLibrary: (layers: LibraryItem["layers"]) => void;
  onInsertLibraryItems: (libraryItems: LibraryItems) => void;
  onSelectItems: (id: LibraryItem["id"][]) => void;
  pendingLayers: LibraryItem["layers"];
  selectedItems: LibraryItem["id"][];
  theme: UIAppState["theme"];
}) => {
  const libraryContainerRef = useRef<HTMLDivLayer>(null);
  const scrollPosition = useScrollPosition<HTMLDivLayer>(libraryContainerRef);

  // This effect has to be called only on first render, therefore  `scrollPosition` isn't in the dependency array
  useEffect(() => {
    if (scrollPosition > 0) {
      libraryContainerRef.current?.scrollTo(0, scrollPosition);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { svgCache } = useLibraryCache();
  const unpublishedItems = useMemo(
    () => libraryItems.filter((item) => item.status !== "published"),
    [libraryItems]
  );

  const publishedItems = useMemo(
    () => libraryItems.filter((item) => item.status === "published"),
    [libraryItems]
  );

  const showBtn = !libraryItems.length && !pendingLayers.length;

  const isLibraryEmpty =
    !pendingLayers.length && !unpublishedItems.length && !publishedItems.length;

  const [lastSelectedItem, setLastSelectedItem] = useState<
    LibraryItem["id"] | null
  >(null);

  const onItemSelectToggle = useCallback(
    (id: LibraryItem["id"], event: React.MouseEvent) => {
      const shouldSelect = !selectedItems.includes(id);

      const orderedItems = [...unpublishedItems, ...publishedItems];

      if (shouldSelect) {
        if (event.shiftKey && lastSelectedItem) {
          const rangeStart = orderedItems.findIndex(
            (item) => item.id === lastSelectedItem
          );
          const rangeEnd = orderedItems.findIndex((item) => item.id === id);

          if (rangeStart === -1 || rangeEnd === -1) {
            onSelectItems([...selectedItems, id]);
            return;
          }

          const selectedItemsMap = arrayToMap(selectedItems);
          const nextSelectedIds = orderedItems.reduce(
            (acc: LibraryItem["id"][], item, idx) => {
              if (
                (idx >= rangeStart && idx <= rangeEnd) ||
                selectedItemsMap.has(item.id)
              ) {
                acc.push(item.id);
              }
              return acc;
            },
            []
          );

          onSelectItems(nextSelectedIds);
        } else {
          onSelectItems([...selectedItems, id]);
        }
        setLastSelectedItem(id);
      } else {
        setLastSelectedItem(null);
        onSelectItems(selectedItems.filter((_id) => _id !== id));
      }
    },
    [
      lastSelectedItem,
      onSelectItems,
      publishedItems,
      selectedItems,
      unpublishedItems
    ]
  );

  const getInsertedLayers = useCallback(
    (id: string) => {
      let targetLayers;
      if (selectedItems.includes(id)) {
        targetLayers = libraryItems.filter((item) =>
          selectedItems.includes(item.id)
        );
      } else {
        targetLayers = libraryItems.filter((item) => item.id === id);
      }
      return targetLayers.map((item) => ({
        ...item,
        // duplicate each library item before inserting on canvas to confine
        // ids and bindings to each library item. See #6465
        layers: duplicateLayers(item.layers, { randomizeSeed: true })
      }));
    },
    [libraryItems, selectedItems]
  );

  const onItemDrag = useCallback(
    (id: LibraryItem["id"], event: React.DragEvent) => {
      event.dataTransfer.setData(
        MIME_TYPES.excalidrawlib,
        serializeLibraryAsJSON(getInsertedLayers(id))
      );
    },
    [getInsertedLayers]
  );

  const isItemSelected = useCallback(
    (id: LibraryItem["id"] | null) => {
      if (!id) {
        return false;
      }

      return selectedItems.includes(id);
    },
    [selectedItems]
  );

  const onAddToLibraryClick = useCallback(() => {
    onAddToLibrary(pendingLayers);
  }, [pendingLayers, onAddToLibrary]);

  const onItemClick = useCallback(
    (id: LibraryItem["id"] | null) => {
      if (id) {
        onInsertLibraryItems(getInsertedLayers(id));
      }
    },
    [getInsertedLayers, onInsertLibraryItems]
  );

  const itemsRenderedPerBatch =
    svgCache.size >= libraryItems.length
      ? CACHED_ITEMS_RENDERED_PER_BATCH
      : ITEMS_RENDERED_PER_BATCH;

  return (
    <div
      className="library-menu-items-container"
      style={
        pendingLayers.length || unpublishedItems.length || publishedItems.length
          ? { justifyContent: "flex-start" }
          : { borderBottom: 0 }
      }
    >
      {!isLibraryEmpty && (
        <LibraryDropdownMenu
          className="library-menu-dropdown-container--in-heading"
          onSelectItems={onSelectItems}
          selectedItems={selectedItems}
        />
      )}
      <Stack.Col
        align="start"
        className="library-menu-items-container__items"
        gap={1}
        ref={libraryContainerRef}
        style={{
          flex: publishedItems.length > 0 ? 1 : "0 1 auto",
          marginBottom: 0
        }}
      >
        <>
          {!isLibraryEmpty && (
            <div className="library-menu-items-container__header">
              {t("labels.personalLib")}
            </div>
          )}
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: "var(--container-padding-y)",
                right: "var(--container-padding-x)",
                transform: "translateY(50%)"
              }}
            >
              <Spinner />
            </div>
          )}
          {!pendingLayers.length && !unpublishedItems.length ? (
            <div className="library-menu-items__no-items">
              <div className="library-menu-items__no-items__label">
                {t("library.noItems")}
              </div>
              <div className="library-menu-items__no-items__hint">
                {publishedItems.length > 0
                  ? t("library.hint_emptyPrivateLibrary")
                  : t("library.hint_emptyLibrary")}
              </div>
            </div>
          ) : (
            <LibraryMenuSectionGrid>
              {pendingLayers.length > 0 && (
                <LibraryMenuSection
                  isItemSelected={isItemSelected}
                  items={[{ id: null, layers: pendingLayers }]}
                  itemsRenderedPerBatch={itemsRenderedPerBatch}
                  onClick={onAddToLibraryClick}
                  onItemDrag={onItemDrag}
                  onItemSelectToggle={onItemSelectToggle}
                  svgCache={svgCache}
                />
              )}
              <LibraryMenuSection
                isItemSelected={isItemSelected}
                items={unpublishedItems}
                itemsRenderedPerBatch={itemsRenderedPerBatch}
                onClick={onItemClick}
                onItemDrag={onItemDrag}
                onItemSelectToggle={onItemSelectToggle}
                svgCache={svgCache}
              />
            </LibraryMenuSectionGrid>
          )}
        </>

        <>
          {(publishedItems.length > 0 ||
            pendingLayers.length > 0 ||
            unpublishedItems.length > 0) && (
            <div className="library-menu-items-container__header library-menu-items-container__header--excal">
              {t("labels.excalidrawLib")}
            </div>
          )}
          {publishedItems.length > 0 ? (
            <LibraryMenuSectionGrid>
              <LibraryMenuSection
                isItemSelected={isItemSelected}
                items={publishedItems}
                itemsRenderedPerBatch={itemsRenderedPerBatch}
                onClick={onItemClick}
                onItemDrag={onItemDrag}
                onItemSelectToggle={onItemSelectToggle}
                svgCache={svgCache}
              />
            </LibraryMenuSectionGrid>
          ) : unpublishedItems.length > 0 ? (
            <div
              style={{
                margin: "1rem 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                fontSize: ".9rem"
              }}
            >
              {t("library.noItems")}
            </div>
          ) : null}
        </>

        {showBtn && (
          <LibraryMenuControlButtons
            id={id}
            libraryReturnUrl={libraryReturnUrl}
            style={{ padding: "16px 0", width: "100%" }}
            theme={theme}
          >
            <LibraryDropdownMenu
              onSelectItems={onSelectItems}
              selectedItems={selectedItems}
            />
          </LibraryMenuControlButtons>
        )}
      </Stack.Col>
    </div>
  );
};
