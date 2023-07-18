import { nanoid } from "nanoid";
import React from "react";

import {
  encryptData,
  generateEncryptionKey
} from "../../../lib/data/encryption/encryption";
import { serializeAsJSON } from "../../../lib/data/json/json";
import { getFrame } from "../../../lib/utils/utils";
import { trackEvent } from "../../analytics";
import { Card } from "../../components/Card";
import { ToolButton } from "../../components/ToolButton";
import { MIME_TYPES } from "../../constants";
import { useI18n } from "../../i18n";
import { isInitializedImageLayer } from "../../layer/typeChecks";
import { FileId, NonDeletedExcalidrawLayer } from "../../layer/types";
import { AppState, BinaryFileData, BinaryFiles } from "../../types";
import { FILE_UPLOAD_MAX_BYTES } from "../app_constants";
import { encodeFilesForUpload } from "../data/FileManager";
import { loadFirebaseStorage, saveFilesToFirebase } from "../data/firebase";
import { excalidrawPlusIcon } from "./icons";

export const exportToExcalidrawPlus = async (
  layers: readonly NonDeletedExcalidrawLayer[],
  editorState: Partial<AppState>,
  files: BinaryFiles
) => {
  const firebase = await loadFirebaseStorage();

  const id = `${nanoid(12)}`;

  const encryptionKey = (await generateEncryptionKey())!;
  const encryptedData = await encryptData(
    encryptionKey,
    serializeAsJSON(layers, editorState, files, "database")
  );

  const blob = new Blob(
    [encryptedData.iv, new Uint8Array(encryptedData.encryptedBuffer)],
    {
      type: MIME_TYPES.binary
    }
  );

  await firebase
    .storage()
    .ref(`/migrations/scenes/${id}`)
    .put(blob, {
      customMetadata: {
        data: JSON.stringify({ version: 2, name: editorState.name }),
        created: Date.now().toString()
      }
    });

  const filesMap = new Map<FileId, BinaryFileData>();
  for (const layer of layers) {
    if (isInitializedImageLayer(layer) && files[layer.fileId]) {
      filesMap.set(layer.fileId, files[layer.fileId]);
    }
  }

  if (filesMap.size) {
    const filesToUpload = await encodeFilesForUpload({
      files: filesMap,
      encryptionKey,
      maxBytes: FILE_UPLOAD_MAX_BYTES
    });

    await saveFilesToFirebase({
      prefix: `/migrations/files/scenes/${id}`,
      files: filesToUpload
    });
  }

  window.open(
    `https://plus.excalidraw.com/import?excalidraw=${id},${encryptionKey}`
  );
};

export const ExportToExcalidrawPlus: React.FC<{
  editorState: Partial<AppState>;
  files: BinaryFiles;
  layers: readonly NonDeletedExcalidrawLayer[];
  onError: (error: Error) => void;
}> = ({ layers, editorState, files, onError }) => {
  const { t } = useI18n();
  return (
    <Card color="primary">
      <div className="Card-icon">{excalidrawPlusIcon}</div>
      <h2>Excalidraw+</h2>
      <div className="Card-details">
        {t("exportDialog.excalidrawplus_description")}
      </div>
      <ToolButton
        aria-label={t("exportDialog.excalidrawplus_button")}
        className="Card-button"
        onClick={async () => {
          try {
            trackEvent("export", "eplus", `ui (${getFrame()})`);
            await exportToExcalidrawPlus(layers, editorState, files);
          } catch (error: any) {
            console.error(error);
            if (error.name !== "AbortError") {
              onError(new Error(t("exportDialog.excalidrawplus_exportError")));
            }
          }
        }}
        showAriaLabel={true}
        title={t("exportDialog.excalidrawplus_button")}
        type="button"
      />
    </Card>
  );
};
