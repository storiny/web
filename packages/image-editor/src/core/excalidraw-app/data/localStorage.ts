import { ImportedDataState } from "../../../lib/data/types";
import {
  clearAppStateForLocalStorage,
  getDefaultAppState
} from "../../editorState";
import { clearLayersForLocalStorage } from "../../layer";
import { ExcalidrawLayer } from "../../layer/types";
import { AppState } from "../../types";
import { STORAGE_KEYS } from "../app_constants";

export const saveUsernameToLocalStorage = (username: string) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_COLLAB,
      JSON.stringify({ username })
    );
  } catch (error: any) {
    // Unable to access window.localStorage
    console.error(error);
  }
};

export const importUsernameFromLocalStorage = (): string | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_COLLAB);
    if (data) {
      return JSON.parse(data).username;
    }
  } catch (error: any) {
    // Unable to access localStorage
    console.error(error);
  }

  return null;
};

export const importFromLocalStorage = () => {
  let savedLayers = null;
  let savedState = null;

  try {
    savedLayers = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS);
    savedState = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_APP_STATE);
  } catch (error: any) {
    // Unable to access localStorage
    console.error(error);
  }

  let layers: ExcalidrawLayer[] = [];
  if (savedLayers) {
    try {
      layers = clearLayersForLocalStorage(JSON.parse(savedLayers));
    } catch (error: any) {
      console.error(error);
      // Do nothing because layers array is already empty
    }
  }

  let editorState = null;
  if (savedState) {
    try {
      editorState = {
        ...getDefaultAppState(),
        ...clearAppStateForLocalStorage(
          JSON.parse(savedState) as Partial<AppState>
        )
      };
    } catch (error: any) {
      console.error(error);
      // Do nothing because editorState is already null
    }
  }
  return { layers, editorState };
};

export const getLayersStorageSize = () => {
  try {
    const layers = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS);
    const layersSize = layers?.length || 0;
    return layersSize;
  } catch (error: any) {
    console.error(error);
    return 0;
  }
};

export const getTotalStorageSize = () => {
  try {
    const editorState = localStorage.getItem(
      STORAGE_KEYS.LOCAL_STORAGE_APP_STATE
    );
    const collab = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_COLLAB);
    const library = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_LIBRARY);

    const editorStateSize = editorState?.length || 0;
    const collabSize = collab?.length || 0;
    const librarySize = library?.length || 0;

    return editorStateSize + collabSize + librarySize + getLayersStorageSize();
  } catch (error: any) {
    console.error(error);
    return 0;
  }
};

export const getLibraryItemsFromStorage = () => {
  try {
    const libraryItems: ImportedDataState["libraryItems"] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_LIBRARY) as string
    );

    return libraryItems || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};
