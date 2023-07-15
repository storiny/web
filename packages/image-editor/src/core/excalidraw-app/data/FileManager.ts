import { compressData } from "../../../lib/data/encode/encode";
import { t } from "../../i18n";
import { newLayerWith } from "../../layer/mutateLayer";
import { isInitializedImageLayer } from "../../layer/typeChecks";
import {
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  FileId,
  InitializedExcalidrawImageLayer
} from "../../layer/types";
import {
  BinaryFileData,
  BinaryFileMetadata,
  BinaryFiles,
  ExcalidrawImperativeAPI
} from "../../types";

export class FileManager {
  /** files being fetched */
  private fetchingFiles = new Map<ExcalidrawImageLayer["fileId"], true>();
  /** files being saved */
  private savingFiles = new Map<ExcalidrawImageLayer["fileId"], true>();
  /* files already saved to persistent storage */
  private savedFiles = new Map<ExcalidrawImageLayer["fileId"], true>();
  private erroredFiles = new Map<ExcalidrawImageLayer["fileId"], true>();

  private _getFiles;
  private _saveFiles;

  constructor({
    getFiles,
    saveFiles
  }: {
    getFiles: (fileIds: FileId[]) => Promise<{
      erroredFiles: Map<FileId, true>;
      loadedFiles: BinaryFileData[];
    }>;
    saveFiles: (data: { addedFiles: Map<FileId, BinaryFileData> }) => Promise<{
      erroredFiles: Map<FileId, true>;
      savedFiles: Map<FileId, true>;
    }>;
  }) {
    this._getFiles = getFiles;
    this._saveFiles = saveFiles;
  }

  /**
   * returns whether file is already saved or being processed
   */
  isFileHandled = (id: FileId) => {
    return (
      this.savedFiles.has(id) ||
      this.fetchingFiles.has(id) ||
      this.savingFiles.has(id) ||
      this.erroredFiles.has(id)
    );
  };

  isFileSaved = (id: FileId) => {
    return this.savedFiles.has(id);
  };

  saveFiles = async ({
    layers,
    files
  }: {
    files: BinaryFiles;
    layers: readonly ExcalidrawLayer[];
  }) => {
    const addedFiles: Map<FileId, BinaryFileData> = new Map();

    for (const layer of layers) {
      if (
        isInitializedImageLayer(layer) &&
        files[layer.fileId] &&
        !this.isFileHandled(layer.fileId)
      ) {
        addedFiles.set(layer.fileId, files[layer.fileId]);
        this.savingFiles.set(layer.fileId, true);
      }
    }

    try {
      const { savedFiles, erroredFiles } = await this._saveFiles({
        addedFiles
      });

      for (const [fileId] of savedFiles) {
        this.savedFiles.set(fileId, true);
      }

      return {
        savedFiles,
        erroredFiles
      };
    } finally {
      for (const [fileId] of addedFiles) {
        this.savingFiles.delete(fileId);
      }
    }
  };

  getFiles = async (
    ids: FileId[]
  ): Promise<{
    erroredFiles: Map<FileId, true>;
    loadedFiles: BinaryFileData[];
  }> => {
    if (!ids.length) {
      return {
        loadedFiles: [],
        erroredFiles: new Map()
      };
    }
    for (const id of ids) {
      this.fetchingFiles.set(id, true);
    }

    try {
      const { loadedFiles, erroredFiles } = await this._getFiles(ids);

      for (const file of loadedFiles) {
        this.savedFiles.set(file.id, true);
      }
      for (const [fileId] of erroredFiles) {
        this.erroredFiles.set(fileId, true);
      }

      return { loadedFiles, erroredFiles };
    } finally {
      for (const id of ids) {
        this.fetchingFiles.delete(id);
      }
    }
  };

  /** a file layer prevents unload only if it's being saved regardless of
   *  its `status`. This ensures that layers who for any reason haven't
   *  beed set to `saved` status don't prevent unload in future sessions.
   *  Technically we should prevent unload when the origin client haven't
   *  yet saved the `status` update to storage, but that should be taken care
   *  of during regular beforeUnload unsaved files check.
   */
  shouldPreventUnload = (layers: readonly ExcalidrawLayer[]) => {
    return layers.some((layer) => {
      return (
        isInitializedImageLayer(layer) &&
        !layer.isDeleted &&
        this.savingFiles.has(layer.fileId)
      );
    });
  };

  /**
   * helper to determine if image layer status needs updating
   */
  shouldUpdateImageLayerStatus = (
    layer: ExcalidrawLayer
  ): layer is InitializedExcalidrawImageLayer => {
    return (
      isInitializedImageLayer(layer) &&
      this.isFileSaved(layer.fileId) &&
      layer.status === "pending"
    );
  };

  reset() {
    this.fetchingFiles.clear();
    this.savingFiles.clear();
    this.savedFiles.clear();
    this.erroredFiles.clear();
  }
}

export const encodeFilesForUpload = async ({
  files,
  maxBytes,
  encryptionKey
}: {
  encryptionKey: string;
  files: Map<FileId, BinaryFileData>;
  maxBytes: number;
}) => {
  const processedFiles: {
    buffer: Uint8Array;
    id: FileId;
  }[] = [];

  for (const [id, fileData] of files) {
    const buffer = new TextEncoder().encode(fileData.dataURL);

    const encodedFile = await compressData<BinaryFileMetadata>(buffer, {
      encryptionKey,
      metadata: {
        id,
        mimeType: fileData.mimeType,
        created: Date.now(),
        lastRetrieved: Date.now()
      }
    });

    if (buffer.byteLength > maxBytes) {
      throw new Error(
        t("errors.fileTooBig", {
          maxSize: `${Math.trunc(maxBytes / 1024 / 1024)}MB`
        })
      );
    }

    processedFiles.push({
      id,
      buffer: encodedFile
    });
  }

  return processedFiles;
};

export const updateStaleImageStatuses = (params: {
  erroredFiles: Map<FileId, true>;
  excalidrawAPI: ExcalidrawImperativeAPI;
  layers: readonly ExcalidrawLayer[];
}) => {
  if (!params.erroredFiles.size) {
    return;
  }
  params.excalidrawAPI.updateScene({
    layers: params.excalidrawAPI
      .getSceneLayersIncludingDeleted()
      .map((layer) => {
        if (
          isInitializedImageLayer(layer) &&
          params.erroredFiles.has(layer.fileId)
        ) {
          return newLayerWith(layer, {
            status: "error"
          });
        }
        return layer;
      })
  });
};
