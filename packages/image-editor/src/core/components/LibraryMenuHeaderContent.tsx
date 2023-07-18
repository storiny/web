import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";

import { fileOpen } from "../../lib/data/fs/filesystem";
import { saveLibraryAsJSON } from "../../lib/data/json/json";
import Library, { libraryItemsAtom } from "../../lib/data/library";
import { useLibraryCache } from "../../lib/hooks/useLibraryItemSvg";
import { muteFSAbortError } from "../../lib/utils/utils";
import { useUIAppState } from "../context/ui-editorState";
import { t } from "../i18n";
import { jotaiScope } from "../jotai";
import { LibraryItem, LibraryItems, UIAppState } from "../types";
import { useApp, useExcalidrawSetAppState } from "./App";
import ConfirmDialog from "./ConfirmDialog";
import { Dialog } from "./Dialog";
import DropdownMenu from "./dropdownMenu/DropdownMenu";
import {
  DotsIcon,
  ExportIcon,
  LoadIcon,
  publishIcon,
  TrashIcon
} from "./icons";
import { isLibraryMenuOpenAtom } from "./LibraryMenu";
import PublishLibrary from "./PublishLibrary";
import { ToolButton } from "./ToolButton";
import Trans from "./Trans";

const getSelectedItems = (
  libraryItems: LibraryItems,
  selectedItems: LibraryItem["id"][]
) => libraryItems.filter((item) => selectedItems.includes(item.id));

export const LibraryDropdownMenuButton: React.FC<{
  className?: string;
  editorState: UIAppState;
  library: Library;
  onRemoveFromLibrary: () => void;
  onSelectItems: (items: LibraryItem["id"][]) => void;
  resetLibrary: () => void;
  selectedItems: LibraryItem["id"][];
  setAppState: React.Component<any, UIAppState>["setState"];
}> = ({
  setAppState,
  selectedItems,
  library,
  onRemoveFromLibrary,
  resetLibrary,
  onSelectItems,
  editorState,
  className
}) => {
  const [libraryItemsData] = useAtom(libraryItemsAtom, jotaiScope);
  const [isLibraryMenuOpen, setIsLibraryMenuOpen] = useAtom(
    isLibraryMenuOpenAtom,
    jotaiScope
  );

  const renderRemoveLibAlert = () => {
    const content = selectedItems.length
      ? t("alerts.removeItemsFromsLibrary", { count: selectedItems.length })
      : t("alerts.resetLibrary");
    const title = selectedItems.length
      ? t("confirmDialog.removeItemsFromLib")
      : t("confirmDialog.resetLibrary");
    return (
      <ConfirmDialog
        onCancel={() => {
          setShowRemoveLibAlert(false);
        }}
        onConfirm={() => {
          if (selectedItems.length) {
            onRemoveFromLibrary();
          } else {
            resetLibrary();
          }
          setShowRemoveLibAlert(false);
        }}
        title={title}
      >
        <p>{content}</p>
      </ConfirmDialog>
    );
  };

  const [showRemoveLibAlert, setShowRemoveLibAlert] = useState(false);

  const itemsSelected = !!selectedItems.length;
  const items = itemsSelected
    ? libraryItemsData.libraryItems.filter((item) =>
        selectedItems.includes(item.id)
      )
    : libraryItemsData.libraryItems;
  const resetLabel = itemsSelected
    ? t("buttons.remove")
    : t("buttons.resetLibrary");

  const [showPublishLibraryDialog, setShowPublishLibraryDialog] =
    useState(false);
  const [publishLibSuccess, setPublishLibSuccess] = useState<null | {
    authorName: string;
    url: string;
  }>(null);
  const renderPublishSuccess = useCallback(
    () => (
      <Dialog
        className="publish-library-success"
        onCloseRequest={() => setPublishLibSuccess(null)}
        size="small"
        title={t("publishSuccessDialog.title")}
      >
        <p>
          <Trans
            authorName={publishLibSuccess!.authorName}
            i18nKey="publishSuccessDialog.content"
            link={(el) => (
              <a
                href={publishLibSuccess?.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {el}
              </a>
            )}
          />
        </p>
        <ToolButton
          aria-label={t("buttons.close")}
          className="publish-library-success-close"
          data-testid="publish-library-success-close"
          label={t("buttons.close")}
          onClick={() => setPublishLibSuccess(null)}
          title={t("buttons.close")}
          type="button"
        />
      </Dialog>
    ),
    [setPublishLibSuccess, publishLibSuccess]
  );

  const onPublishLibSuccess = (
    data: { authorName: string; url: string },
    libraryItems: LibraryItems
  ) => {
    setShowPublishLibraryDialog(false);
    setPublishLibSuccess({ url: data.url, authorName: data.authorName });
    const nextLibItems = libraryItems.slice();
    nextLibItems.forEach((libItem) => {
      if (selectedItems.includes(libItem.id)) {
        libItem.status = "published";
      }
    });
    library.setLibrary(nextLibItems);
  };

  const onLibraryImport = async () => {
    try {
      await library.updateLibrary({
        libraryItems: fileOpen({
          description: "Excalidraw library files"
          // ToDo: Be over-permissive until https://bugs.webkit.org/show_bug.cgi?id=34442
          // gets resolved. Else, iOS users cannot open `.excalidraw` files.
          /*
            extensions: [".json", ".excalidrawlib"],
            */
        }),
        merge: true,
        openLibraryMenu: true
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.warn(error);
        return;
      }
      setAppState({ errorMessage: t("errors.importLibraryError") });
    }
  };

  const onLibraryExport = async () => {
    const libraryItems = itemsSelected
      ? items
      : await library.getLatestLibrary();
    saveLibraryAsJSON(libraryItems)
      .catch(muteFSAbortError)
      .catch((error) => {
        setAppState({ errorMessage: error.message });
      });
  };

  const renderLibraryMenu = () => (
    <DropdownMenu open={isLibraryMenuOpen}>
      <DropdownMenu.Trigger
        onToggle={() => setIsLibraryMenuOpen(!isLibraryMenuOpen)}
      >
        {DotsIcon}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className="library-menu"
        onClickOutside={() => setIsLibraryMenuOpen(false)}
        onSelect={() => setIsLibraryMenuOpen(false)}
      >
        {!itemsSelected && (
          <DropdownMenu.Item
            data-testid="lib-dropdown--load"
            icon={LoadIcon}
            onSelect={onLibraryImport}
          >
            {t("buttons.load")}
          </DropdownMenu.Item>
        )}
        {!!items.length && (
          <DropdownMenu.Item
            data-testid="lib-dropdown--export"
            icon={ExportIcon}
            onSelect={onLibraryExport}
          >
            {t("buttons.export")}
          </DropdownMenu.Item>
        )}
        {!!items.length && (
          <DropdownMenu.Item
            icon={TrashIcon}
            onSelect={() => setShowRemoveLibAlert(true)}
          >
            {resetLabel}
          </DropdownMenu.Item>
        )}
        {itemsSelected && (
          <DropdownMenu.Item
            data-testid="lib-dropdown--remove"
            icon={publishIcon}
            onSelect={() => setShowPublishLibraryDialog(true)}
          >
            {t("buttons.publishLibrary")}
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );

  return (
    <div className={clsx("library-menu-dropdown-container", className)}>
      {renderLibraryMenu()}
      {selectedItems.length > 0 && (
        <div className="library-actions-counter">{selectedItems.length}</div>
      )}
      {showRemoveLibAlert && renderRemoveLibAlert()}
      {showPublishLibraryDialog && (
        <PublishLibrary
          editorState={editorState}
          libraryItems={getSelectedItems(
            libraryItemsData.libraryItems,
            selectedItems
          )}
          onClose={() => setShowPublishLibraryDialog(false)}
          onError={(error) => window.alert(error)}
          onRemove={(id: string) =>
            onSelectItems(selectedItems.filter((_id) => _id !== id))
          }
          onSuccess={(data) =>
            onPublishLibSuccess(data, libraryItemsData.libraryItems)
          }
          updateItemsInStorage={() =>
            library.setLibrary(libraryItemsData.libraryItems)
          }
        />
      )}
      {publishLibSuccess && renderPublishSuccess()}
    </div>
  );
};

export const LibraryDropdownMenu = ({
  selectedItems,
  onSelectItems,
  className
}: {
  className?: string;
  onSelectItems: (id: LibraryItem["id"][]) => void;
  selectedItems: LibraryItem["id"][];
}) => {
  const { library } = useApp();
  const { clearLibraryCache, deleteItemsFromLibraryCache } = useLibraryCache();
  const editorState = useUIAppState();
  const setAppState = useExcalidrawSetAppState();

  const [libraryItemsData] = useAtom(libraryItemsAtom, jotaiScope);

  const removeFromLibrary = async (libraryItems: LibraryItems) => {
    const nextItems = libraryItems.filter(
      (item) => !selectedItems.includes(item.id)
    );
    library.setLibrary(nextItems).catch(() => {
      setAppState({ errorMessage: t("alerts.errorRemovingFromLibrary") });
    });

    deleteItemsFromLibraryCache(selectedItems);

    onSelectItems([]);
  };

  const resetLibrary = () => {
    library.resetLibrary();
    clearLibraryCache();
  };

  return (
    <LibraryDropdownMenuButton
      className={className}
      editorState={editorState}
      library={library}
      onRemoveFromLibrary={() =>
        removeFromLibrary(libraryItemsData.libraryItems)
      }
      onSelectItems={onSelectItems}
      resetLibrary={resetLibrary}
      selectedItems={selectedItems}
      setAppState={setAppState}
    />
  );
};
