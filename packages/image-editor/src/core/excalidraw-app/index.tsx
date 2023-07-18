import "./index.scss";

import clsx from "clsx";
import LanguageDetector from "i18next-browser-languagedetector";
import { atom, Provider, useAtom, useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

import { loadFromBlob } from "../../lib/data/blob/blob";
import {
  parseLibraryTokensFromUrl,
  useHandleLibrary
} from "../../lib/data/library";
import {
  restore,
  restoreAppState,
  RestoredDataState
} from "../../lib/data/restore/restore";
import { useCallbackRefState } from "../../lib/hooks/useCallbackRefState";
import {
  defaultLang,
  Excalidraw,
  LiveCollaborationTrigger
} from "../../lib/packages/excalidraw/index";
import {
  debounce,
  getFrame,
  getVersion,
  isRunningInIframe,
  isTestEnv,
  preventUnload,
  ResolvablePromise,
  resolvablePromise
} from "../../lib/utils/utils";
import { trackEvent } from "../analytics";
import { ErrorDialog } from "../components/ErrorDialog";
import { OverwriteConfirmDialog } from "../components/OverwriteConfirm/OverwriteConfirm";
import { openConfirmModal } from "../components/OverwriteConfirm/OverwriteConfirmState";
import { ShareableLinkDialog } from "../components/ShareableLinkDialog";
import { TopErrorBoundary } from "../components/TopErrorBoundary";
import Trans from "../components/Trans";
import {
  APP_NAME,
  EVENT,
  THEME,
  TITLE_TIMEOUT,
  VERSION_TIMEOUT
} from "../constants";
import { getDefaultAppState } from "../editorState";
import { t } from "../i18n";
import { useAtomWithInitialValue } from "../jotai";
import { newLayerWith } from "../layer/mutateLayer";
import { isInitializedImageLayer } from "../layer/typeChecks";
import {
  ExcalidrawLayer,
  FileId,
  NonDeletedExcalidrawLayer,
  Theme
} from "../layer/types";
import polyfill from "../polyfill";
import {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  LibraryItems,
  UIAppState
} from "../types";
import { ResolutionType } from "../utility-types";
import {
  FIREBASE_STORAGE_PREFIXES,
  STORAGE_KEYS,
  SYNC_BROWSER_TABS_TIMEOUT
} from "./app_constants";
import { appJotaiStore } from "./app-jotai";
import Collab, {
  CollabAPI,
  collabAPIAtom,
  collabDialogShownAtom,
  isCollaboratingAtom,
  isOfflineAtom
} from "./collab/Collab";
import { reconcileLayers } from "./collab/reconciliation";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import {
  ExportToExcalidrawPlus,
  exportToExcalidrawPlus
} from "./components/ExportToExcalidrawPlus";
import CustomStats from "./CustomStats";
import {
  exportToBackend,
  getCollaborationLinkData,
  isCollaborationLink,
  loadScene
} from "./data";
import { updateStaleImageStatuses } from "./data/FileManager";
import { loadFilesFromFirebase } from "./data/firebase";
import { LocalData } from "./data/LocalData";
import {
  getLibraryItemsFromStorage,
  importFromLocalStorage,
  importUsernameFromLocalStorage
} from "./data/localStorage";
import { isBrowserStorageStateNewer } from "./data/tabSync";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

const languageDetector = new LanguageDetector();
languageDetector.init({
  languageUtils: {}
});

const shareableLinkConfirmDialog = {
  title: t("overwriteConfirm.modal.shareableLink.title"),
  description: (
    <Trans
      bold={(text) => <strong>{text}</strong>}
      br={() => <br />}
      i18nKey="overwriteConfirm.modal.shareableLink.description"
    />
  ),
  actionLabel: t("overwriteConfirm.modal.shareableLink.button"),
  color: "danger"
} as const;

const initializeScene = async (opts: {
  collabAPI: CollabAPI | null;
  excalidrawAPI: ExcalidrawImperativeAPI;
}): Promise<
  { scene: ExcalidrawInitialDataState | null } & (
    | { id: string; isExternalScene: true; key: string }
    | { id?: null; isExternalScene: false; key?: null }
  )
> => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  const jsonBackendMatch = window.location.hash.match(
    /^#json=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/
  );
  const externalUrlMatch = window.location.hash.match(/^#url=(.*)$/);

  const localDataState = importFromLocalStorage();

  let scene: RestoredDataState & {
    scrollToContent?: boolean;
  } = await loadScene(null, null, localDataState);

  let roomLinkData = getCollaborationLinkData(window.location.href);
  const isExternalScene = !!(id || jsonBackendMatch || roomLinkData);
  if (isExternalScene) {
    if (
      // don't prompt if scene is empty
      !scene.layers.length ||
      // don't prompt for collab scenes because we don't override local storage
      roomLinkData ||
      // otherwise, prompt whether user wants to override current scene
      (await openConfirmModal(shareableLinkConfirmDialog))
    ) {
      if (jsonBackendMatch) {
        scene = await loadScene(
          jsonBackendMatch[1],
          jsonBackendMatch[2],
          localDataState
        );
      }
      scene.scrollToContent = true;
      if (!roomLinkData) {
        window.history.replaceState({}, APP_NAME, window.location.origin);
      }
    } else {
      // https://github.com/excalidraw/excalidraw/issues/1919
      if (document.hidden) {
        return new Promise((resolve, reject) => {
          window.addEventListener(
            "focus",
            () => initializeScene(opts).then(resolve).catch(reject),
            {
              once: true
            }
          );
        });
      }

      roomLinkData = null;
      window.history.replaceState({}, APP_NAME, window.location.origin);
    }
  } else if (externalUrlMatch) {
    window.history.replaceState({}, APP_NAME, window.location.origin);

    const url = externalUrlMatch[1];
    try {
      const request = await fetch(window.decodeURIComponent(url));
      const data = await loadFromBlob(await request.blob(), null, null);
      if (
        !scene.layers.length ||
        (await openConfirmModal(shareableLinkConfirmDialog))
      ) {
        return { scene: data, isExternalScene };
      }
    } catch (error: any) {
      return {
        scene: {
          editorState: {
            errorMessage: t("alerts.invalidSceneUrl")
          }
        },
        isExternalScene
      };
    }
  }

  if (roomLinkData && opts.collabAPI) {
    const { excalidrawAPI } = opts;

    const scene = await opts.collabAPI.startCollaboration(roomLinkData);

    return {
      // when collaborating, the state may have already been updated at this
      // point (we may have received updates from other clients), so reconcile
      // layers and editorState with existing state
      scene: {
        ...scene,
        editorState: {
          ...restoreAppState(
            {
              ...scene?.editorState,
              theme:
                localDataState?.editorState?.theme || scene?.editorState?.theme
            },
            excalidrawAPI.getAppState()
          ),
          // necessary if we're invoking from a hashchange handler which doesn't
          // go through App.initializeScene() that resets this flag
          isLoading: false
        },
        layers: reconcileLayers(
          scene?.layers || [],
          excalidrawAPI.getSceneLayersIncludingDeleted(),
          excalidrawAPI.getAppState()
        )
      },
      isExternalScene: true,
      id: roomLinkData.roomId,
      key: roomLinkData.roomKey
    };
  } else if (scene) {
    return isExternalScene && jsonBackendMatch
      ? {
          scene,
          isExternalScene,
          id: jsonBackendMatch[1],
          key: jsonBackendMatch[2]
        }
      : { scene, isExternalScene: false };
  }
  return { scene: null, isExternalScene: false };
};

const detectedLangCode = languageDetector.detect() || defaultLang.code;
export const appLangCodeAtom = atom(
  Array.isArray(detectedLangCode) ? detectedLangCode[0] : detectedLangCode
);

const ExcalidrawWrapper = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [langCode, setLangCode] = useAtom(appLangCodeAtom);
  const isCollabDisabled = isRunningInIframe();

  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  useEffect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
  }, []);

  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();

  const [collabAPI] = useAtom(collabAPIAtom);
  const [, setCollabDialogShown] = useAtom(collabDialogShownAtom);
  const [isCollaborating] = useAtomWithInitialValue(isCollaboratingAtom, () =>
    isCollaborationLink(window.location.href)
  );

  useHandleLibrary({
    excalidrawAPI,
    getInitialLibraryItems: getLibraryItemsFromStorage
  });

  useEffect(() => {
    if (!excalidrawAPI || (!isCollabDisabled && !collabAPI)) {
      return;
    }

    const loadImages = (
      data: ResolutionType<typeof initializeScene>,
      isInitialLoad = false
    ) => {
      if (!data.scene) {
        return;
      }
      if (collabAPI?.isCollaborating()) {
        if (data.scene.layers) {
          collabAPI
            .fetchImageFilesFromFirebase({
              layers: data.scene.layers,
              forceFetchFiles: true
            })
            .then(({ loadedFiles, erroredFiles }) => {
              excalidrawAPI.addFiles(loadedFiles);
              updateStaleImageStatuses({
                excalidrawAPI,
                erroredFiles,
                layers: excalidrawAPI.getSceneLayersIncludingDeleted()
              });
            });
        }
      } else {
        const fileIds =
          data.scene.layers?.reduce((acc, layer) => {
            if (isInitializedImageLayer(layer)) {
              return acc.concat(layer.fileId);
            }
            return acc;
          }, [] as FileId[]) || [];

        if (data.isExternalScene) {
          loadFilesFromFirebase(
            `${FIREBASE_STORAGE_PREFIXES.shareLinkFiles}/${data.id}`,
            data.key,
            fileIds
          ).then(({ loadedFiles, erroredFiles }) => {
            excalidrawAPI.addFiles(loadedFiles);
            updateStaleImageStatuses({
              excalidrawAPI,
              erroredFiles,
              layers: excalidrawAPI.getSceneLayersIncludingDeleted()
            });
          });
        } else if (isInitialLoad) {
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  layers: excalidrawAPI.getSceneLayersIncludingDeleted()
                });
              });
          }
          // on fresh load, clear unused files from IDB (from previous
          // session)
          LocalData.fileStorage.clearObsoleteFiles({ currentFileIds: fileIds });
        }
      }
    };

    initializeScene({ collabAPI, excalidrawAPI }).then(async (data) => {
      loadImages(data, /* isInitialLoad */ true);
      initialStatePromiseRef.current.promise.resolve(data.scene);
    });

    const onHashChange = async (event: HashChangeEvent) => {
      event.preventDefault();
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (!libraryUrlTokens) {
        if (
          collabAPI?.isCollaborating() &&
          !isCollaborationLink(window.location.href)
        ) {
          collabAPI.stopCollaboration(false);
        }
        excalidrawAPI.updateScene({ editorState: { isLoading: true } });

        initializeScene({ collabAPI, excalidrawAPI }).then((data) => {
          loadImages(data);
          if (data.scene) {
            excalidrawAPI.updateScene({
              ...data.scene,
              ...restore(data.scene, null, null, { repairBindings: true }),
              commitToHistory: true
            });
          }
        });
      }
    };

    const titleTimeout = setTimeout(
      () => (document.title = APP_NAME),
      TITLE_TIMEOUT
    );

    const syncData = debounce(() => {
      if (isTestEnv()) {
        return;
      }
      if (
        !document.hidden &&
        ((collabAPI && !collabAPI.isCollaborating()) || isCollabDisabled)
      ) {
        // don't sync if local state is newer or identical to browser state
        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
          const localDataState = importFromLocalStorage();
          const username = importUsernameFromLocalStorage();
          let langCode = languageDetector.detect() || defaultLang.code;
          if (Array.isArray(langCode)) {
            langCode = langCode[0];
          }
          setLangCode(langCode);
          excalidrawAPI.updateScene({
            ...localDataState
          });
          excalidrawAPI.updateLibrary({
            libraryItems: getLibraryItemsFromStorage()
          });
          collabAPI?.setUsername(username || "");
        }

        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
          const layers = excalidrawAPI.getSceneLayersIncludingDeleted();
          const currFiles = excalidrawAPI.getFiles();
          const fileIds =
            layers?.reduce((acc, layer) => {
              if (
                isInitializedImageLayer(layer) &&
                // only load and update images that aren't already loaded
                !currFiles[layer.fileId]
              ) {
                return acc.concat(layer.fileId);
              }
              return acc;
            }, [] as FileId[]) || [];
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  layers: excalidrawAPI.getSceneLayersIncludingDeleted()
                });
              });
          }
        }
      }
    }, SYNC_BROWSER_TABS_TIMEOUT);

    const onUnload = () => {
      LocalData.flushSave();
    };

    const visibilityChange = (event: FocusEvent | Event) => {
      if (event.type === EVENT.BLUR || document.hidden) {
        LocalData.flushSave();
      }
      if (
        event.type === EVENT.VISIBILITY_CHANGE ||
        event.type === EVENT.FOCUS
      ) {
        syncData();
      }
    };

    window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
    window.addEventListener(EVENT.UNLOAD, onUnload, false);
    window.addEventListener(EVENT.BLUR, visibilityChange, false);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
    window.addEventListener(EVENT.FOCUS, visibilityChange, false);
    return () => {
      window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
      window.removeEventListener(EVENT.UNLOAD, onUnload, false);
      window.removeEventListener(EVENT.BLUR, visibilityChange, false);
      window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
      document.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false
      );
      clearTimeout(titleTimeout);
    };
  }, [isCollabDisabled, collabAPI, excalidrawAPI, setLangCode]);

  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      if (
        excalidrawAPI &&
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneLayers()
        )
      ) {
        preventUnload(event);
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  }, [excalidrawAPI]);

  useEffect(() => {
    languageDetector.cacheUserLanguage(langCode);
  }, [langCode]);

  const [theme, setTheme] = useState<Theme>(
    () =>
      localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME) ||
      // FIXME migration from old LS scheme. Can be removed later. #5660
      importFromLocalStorage().editorState?.theme ||
      THEME.LIGHT
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, theme);
    // currently only used for body styling during init (see public/index.html),
    // but may change in the future
    document.documentLayer.classList.toggle("dark", theme === THEME.DARK);
  }, [theme]);

  const onChange = (
    layers: readonly ExcalidrawLayer[],
    editorState: AppState,
    files: BinaryFiles
  ) => {
    if (collabAPI?.isCollaborating()) {
      collabAPI.syncLayers(layers);
    }

    setTheme(editorState.theme);

    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(layers, editorState, files, () => {
        if (excalidrawAPI) {
          let didChange = false;

          const layers = excalidrawAPI
            .getSceneLayersIncludingDeleted()
            .map((layer) => {
              if (LocalData.fileStorage.shouldUpdateImageLayerStatus(layer)) {
                const newLayer = newLayerWith(layer, { status: "saved" });
                if (newLayer !== layer) {
                  didChange = true;
                }
                return newLayer;
              }
              return layer;
            });

          if (didChange) {
            excalidrawAPI.updateScene({
              layers
            });
          }
        }
      });
    }
  };

  const [latestShareableLink, setLatestShareableLink] = useState<string | null>(
    null
  );

  const onExportToBackend = async (
    exportedLayers: readonly NonDeletedExcalidrawLayer[],
    editorState: Partial<AppState>,
    files: BinaryFiles,
    canvas: HTMLCanvasLayer | null
  ) => {
    if (exportedLayers.length === 0) {
      return window.alert(t("alerts.cannotExportEmptyCanvas"));
    }
    if (canvas) {
      try {
        const { url, errorMessage } = await exportToBackend(
          exportedLayers,
          {
            ...editorState,
            viewBackgroundColor: editorState.exportBackground
              ? editorState.viewBackgroundColor
              : getDefaultAppState().viewBackgroundColor
          },
          files
        );

        if (errorMessage) {
          setErrorMessage(errorMessage);
        }

        if (url) {
          setLatestShareableLink(url);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          const { width, height } = canvas;
          console.error(error, { width, height });
          setErrorMessage(error.message);
        }
      }
    }
  };

  const renderCustomStats = (
    layers: readonly NonDeletedExcalidrawLayer[],
    editorState: UIAppState
  ) => (
    <CustomStats
      editorState={editorState}
      layers={layers}
      setToast={(message) => excalidrawAPI!.setToast({ message })}
    />
  );

  const onLibraryChange = async (items: LibraryItems) => {
    if (!items.length) {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_STORAGE_LIBRARY);
      return;
    }
    const serializedItems = JSON.stringify(items);
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_LIBRARY, serializedItems);
  };

  const isOffline = useAtomValue(isOfflineAtom);

  return (
    <div
      className={clsx("excalidraw-app", {
        "is-collaborating": isCollaborating
      })}
      style={{ height: "100%" }}
    >
      <Excalidraw
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
            export: {
              onExportToBackend,
              renderCustomUI: (layers, editorState, files) => (
                <ExportToExcalidrawPlus
                  editorState={editorState}
                  files={files}
                  layers={layers}
                  onError={(error) => {
                    excalidrawAPI?.updateScene({
                      editorState: {
                        errorMessage: error.message
                      }
                    });
                  }}
                />
              )
            }
          }
        }}
        autoFocus={true}
        detectScroll={false}
        handleKeyboardGlobally={true}
        initialData={initialStatePromiseRef.current.promise}
        isCollaborating={isCollaborating}
        langCode={langCode}
        onChange={onChange}
        onLibraryChange={onLibraryChange}
        onPointerUpdate={collabAPI?.onPointerUpdate}
        ref={excalidrawRefCallback}
        renderCustomStats={renderCustomStats}
        renderTopRightUI={(isMobile) => {
          if (isMobile || !collabAPI || isCollabDisabled) {
            return null;
          }
          return (
            <LiveCollaborationTrigger
              isCollaborating={isCollaborating}
              onSelect={() => setCollabDialogShown(true)}
            />
          );
        }}
        theme={theme}
      >
        <AppMainMenu
          isCollabEnabled={!isCollabDisabled}
          isCollaborating={isCollaborating}
          setCollabDialogShown={setCollabDialogShown}
        />
        <AppWelcomeScreen
          isCollabEnabled={!isCollabDisabled}
          setCollabDialogShown={setCollabDialogShown}
        />
        <OverwriteConfirmDialog>
          <OverwriteConfirmDialog.Actions.ExportToImage />
          <OverwriteConfirmDialog.Actions.SaveToDisk />
          {excalidrawAPI && (
            <OverwriteConfirmDialog.Action
              actionLabel={t("overwriteConfirm.action.excalidrawPlus.button")}
              onClick={() => {
                exportToExcalidrawPlus(
                  excalidrawAPI.getSceneLayers(),
                  excalidrawAPI.getAppState(),
                  excalidrawAPI.getFiles()
                );
              }}
              title={t("overwriteConfirm.action.excalidrawPlus.title")}
            >
              {t("overwriteConfirm.action.excalidrawPlus.description")}
            </OverwriteConfirmDialog.Action>
          )}
        </OverwriteConfirmDialog>
        <AppFooter />
        {isCollaborating && isOffline && (
          <div className="collab-offline-warning">
            {t("alerts.collabOfflineWarning")}
          </div>
        )}
        {latestShareableLink && (
          <ShareableLinkDialog
            link={latestShareableLink}
            onCloseRequest={() => setLatestShareableLink(null)}
            setErrorMessage={setErrorMessage}
          />
        )}
        {excalidrawAPI && !isCollabDisabled && (
          <Collab excalidrawAPI={excalidrawAPI} />
        )}
        {errorMessage && (
          <ErrorDialog onClose={() => setErrorMessage("")}>
            {errorMessage}
          </ErrorDialog>
        )}
      </Excalidraw>
    </div>
  );
};

const ExcalidrawApp = () => (
  <TopErrorBoundary>
    <Provider unstable_createStore={() => appJotaiStore}>
      <ExcalidrawWrapper />
    </Provider>
  </TopErrorBoundary>
);

export default ExcalidrawApp;
