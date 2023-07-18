import "./PublishLibrary.scss";

import OpenColor from "open-color";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { canvasToBlob, resizeImageFile } from "../../lib/data/blob/blob";
import { ExportedLibraryData } from "../../lib/data/types";
import { exportToCanvas, exportToSvg } from "../../lib/packages/utils";
import { chunk } from "../../lib/utils/utils";
import {
  EXPORT_DATA_TYPES,
  EXPORT_SOURCE,
  MIME_TYPES,
  VERSIONS
} from "../constants";
import { t } from "../i18n";
import { LibraryItem, LibraryItems, UIAppState } from "../types";
import { Dialog } from "./Dialog";
import DialogActionButton from "./DialogActionButton";
import { CloseIcon } from "./icons";
import { ToolButton } from "./ToolButton";
import Trans from "./Trans";

interface PublishLibraryDataParams {
  authorName: string;
  description: string;
  githubHandle: string;
  name: string;
  twitterHandle: string;
  website: string;
}

const LOCAL_STORAGE_KEY_PUBLISH_LIBRARY = "publish-library-data";

const savePublishLibDataToStorage = (data: PublishLibraryDataParams) => {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_PUBLISH_LIBRARY,
      JSON.stringify(data)
    );
  } catch (error: any) {
    // Unable to access window.localStorage
    console.error(error);
  }
};

const importPublishLibDataFromStorage = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY_PUBLISH_LIBRARY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error: any) {
    // Unable to access localStorage
    console.error(error);
  }

  return null;
};

const generatePreviewImage = async (libraryItems: LibraryItems) => {
  const MAX_ITEMS_PER_ROW = 6;
  const BOX_SIZE = 128;
  const BOX_PADDING = Math.round(BOX_SIZE / 16);
  const BORDER_WIDTH = Math.max(Math.round(BOX_SIZE / 64), 2);

  const rows = chunk(libraryItems, MAX_ITEMS_PER_ROW);

  const canvas = document.createLayer("canvas");

  canvas.width =
    rows[0].length * BOX_SIZE +
    (rows[0].length + 1) * (BOX_PADDING * 2) -
    BOX_PADDING * 2;
  canvas.height =
    rows.length * BOX_SIZE +
    (rows.length + 1) * (BOX_PADDING * 2) -
    BOX_PADDING * 2;

  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = OpenColor.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw items
  // ---------------------------------------------------------------------------
  for (const [index, item] of libraryItems.entries()) {
    const itemCanvas = await exportToCanvas({
      layers: item.layers,
      files: null,
      maxWidthOrHeight: BOX_SIZE
    });

    const { width, height } = itemCanvas;

    // draw item
    // -------------------------------------------------------------------------
    const rowOffset =
      Math.floor(index / MAX_ITEMS_PER_ROW) * (BOX_SIZE + BOX_PADDING * 2);
    const colOffset =
      (index % MAX_ITEMS_PER_ROW) * (BOX_SIZE + BOX_PADDING * 2);

    ctx.drawImage(
      itemCanvas,
      colOffset + (BOX_SIZE - width) / 2 + BOX_PADDING,
      rowOffset + (BOX_SIZE - height) / 2 + BOX_PADDING
    );

    // draw item border
    // -------------------------------------------------------------------------
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeStyle = OpenColor.gray[4];
    ctx.strokeRect(
      colOffset + BOX_PADDING / 2,
      rowOffset + BOX_PADDING / 2,
      BOX_SIZE + BOX_PADDING,
      BOX_SIZE + BOX_PADDING
    );
  }

  return await resizeImageFile(
    new File([await canvasToBlob(canvas)], "preview", { type: MIME_TYPES.png }),
    {
      outputType: MIME_TYPES.jpg,
      maxWidthOrHeight: 5000
    }
  );
};

const SingleLibraryItem = ({
  libItem,
  editorState,
  index,
  onChange,
  onRemove
}: {
  editorState: UIAppState;
  index: number;
  libItem: LibraryItem;
  onChange: (val: string, index: number) => void;
  onRemove: (id: string) => void;
}) => {
  const svgRef = useRef<HTMLDivLayer | null>(null);
  const inputRef = useRef<HTMLInputLayer | null>(null);

  useEffect(() => {
    const node = svgRef.current;
    if (!node) {
      return;
    }
    (async () => {
      const svg = await exportToSvg({
        layers: libItem.layers,
        editorState: {
          ...editorState,
          viewBackgroundColor: OpenColor.white,
          exportBackground: true
        },
        files: null
      });
      node.innerHTML = svg.outerHTML;
    })();
  }, [libItem.layers, editorState]);

  return (
    <div className="single-library-item">
      {libItem.status === "published" && (
        <span className="single-library-item-status">
          {t("labels.statusPublished")}
        </span>
      )}
      <div className="single-library-item__svg" ref={svgRef} />
      <ToolButton
        aria-label={t("buttons.remove")}
        className="single-library-item--remove"
        icon={CloseIcon}
        onClick={onRemove.bind(null, libItem.id)}
        title={t("buttons.remove")}
        type="button"
      />
      <div
        style={{
          display: "flex",
          margin: "0.8rem 0",
          width: "100%",
          fontSize: "14px",
          fontWeight: 500,
          flexDirection: "column"
        }}
      >
        <label
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column"
          }}
        >
          <div style={{ padding: "0.5em 0" }}>
            <span style={{ fontWeight: 500, color: OpenColor.gray[6] }}>
              {t("publishDialog.itemName")}
            </span>
            <span aria-hidden="true" className="required">
              *
            </span>
          </div>
          <input
            defaultValue={libItem.name}
            onChange={(event) => {
              onChange(event.target.value, index);
            }}
            placeholder="Item name"
            ref={inputRef}
            style={{ width: "80%", padding: "0.2rem" }}
            type="text"
          />
        </label>
        <span className="error">{libItem.error}</span>
      </div>
    </div>
  );
};

const PublishLibrary = ({
  onClose,
  libraryItems,
  editorState,
  onSuccess,
  onError,
  updateItemsInStorage,
  onRemove
}: {
  editorState: UIAppState;
  libraryItems: LibraryItems;
  onClose: () => void;
  onError: (error: Error) => void;

  onRemove: (id: string) => void;
  onSuccess: (data: {
    authorName: string;
    items: LibraryItems;
    url: string;
  }) => void;
  updateItemsInStorage: (items: LibraryItems) => void;
}) => {
  const [libraryData, setLibraryData] = useState<PublishLibraryDataParams>({
    authorName: "",
    githubHandle: "",
    name: "",
    description: "",
    twitterHandle: "",
    website: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const data = importPublishLibDataFromStorage();
    if (data) {
      setLibraryData(data);
    }
  }, []);

  const [clonedLibItems, setClonedLibItems] = useState<LibraryItems>(
    libraryItems.slice()
  );

  useEffect(() => {
    setClonedLibItems(libraryItems.slice());
  }, [libraryItems]);

  const onInputChange = (event: any) => {
    setLibraryData({
      ...libraryData,
      [event.target.name]: event.target.value
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormLayer>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const erroredLibItems: LibraryItem[] = [];
    let isError = false;
    clonedLibItems.forEach((libItem) => {
      let error = "";
      if (!libItem.name) {
        error = t("publishDialog.errors.required");
        isError = true;
      }
      erroredLibItems.push({ ...libItem, error });
    });

    if (isError) {
      setClonedLibItems(erroredLibItems);
      setIsSubmitting(false);
      return;
    }

    const previewImage = await generatePreviewImage(clonedLibItems);

    const libContent: ExportedLibraryData = {
      type: EXPORT_DATA_TYPES.excalidrawLibrary,
      version: VERSIONS.excalidrawLibrary,
      source: EXPORT_SOURCE,
      libraryItems: clonedLibItems
    };
    const content = JSON.stringify(libContent, null, 2);
    const lib = new Blob([content], { type: "application/json" });

    const formData = new FormData();
    formData.append("excalidrawLib", lib);
    formData.append("previewImage", previewImage);
    formData.append("previewImageType", previewImage.type);
    formData.append("title", libraryData.name);
    formData.append("authorName", libraryData.authorName);
    formData.append("githubHandle", libraryData.githubHandle);
    formData.append("name", libraryData.name);
    formData.append("description", libraryData.description);
    formData.append("twitterHandle", libraryData.twitterHandle);
    formData.append("website", libraryData.website);

    fetch(`${process.env.REACT_APP_LIBRARY_BACKEND}/submit`, {
      method: "post",
      body: formData
    })
      .then(
        (response) => {
          if (response.ok) {
            return response.json().then(({ url }) => {
              // flush data from local storage
              localStorage.removeItem(LOCAL_STORAGE_KEY_PUBLISH_LIBRARY);
              onSuccess({
                url,
                authorName: libraryData.authorName,
                items: clonedLibItems
              });
            });
          }
          return response
            .json()
            .catch(() => {
              throw new Error(response.statusText || "something went wrong");
            })
            .then((error) => {
              throw new Error(
                error.message || response.statusText || "something went wrong"
              );
            });
        },
        (err) => {
          console.error(err);
          onError(err);
          setIsSubmitting(false);
        }
      )
      .catch((err) => {
        console.error(err);
        onError(err);
        setIsSubmitting(false);
      });
  };

  const renderLibraryItems = () => {
    const items: ReactNode[] = [];
    clonedLibItems.forEach((libItem, index) => {
      items.push(
        <div className="single-library-item-wrapper" key={index}>
          <SingleLibraryItem
            editorState={editorState}
            index={index}
            libItem={libItem}
            onChange={(val, index) => {
              const items = clonedLibItems.slice();
              items[index].name = val;
              setClonedLibItems(items);
            }}
            onRemove={onRemove}
          />
        </div>
      );
    });
    return <div className="selected-library-items">{items}</div>;
  };

  const onDialogClose = useCallback(() => {
    updateItemsInStorage(clonedLibItems);
    savePublishLibDataToStorage(libraryData);
    onClose();
  }, [clonedLibItems, onClose, updateItemsInStorage, libraryData]);

  const shouldRenderForm = !!libraryItems.length;

  const containsPublishedItems = libraryItems.some(
    (item) => item.status === "published"
  );

  return (
    <Dialog
      className="publish-library"
      onCloseRequest={onDialogClose}
      title={t("publishDialog.title")}
    >
      {shouldRenderForm ? (
        <form onSubmit={onSubmit}>
          <div className="publish-library-note">
            <Trans
              i18nKey="publishDialog.noteDescription"
              link={(el) => (
                <a
                  href="https://libraries.excalidraw.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {el}
                </a>
              )}
            />
          </div>
          <span className="publish-library-note">
            <Trans
              i18nKey="publishDialog.noteGuidelines"
              link={(el) => (
                <a
                  href="https://github.com/excalidraw/excalidraw-libraries#guidelines"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {el}
                </a>
              )}
            />
          </span>

          <div className="publish-library-note">
            {t("publishDialog.noteItems")}
          </div>
          {containsPublishedItems && (
            <span className="publish-library-note publish-library-warning">
              {t("publishDialog.republishWarning")}
            </span>
          )}
          {renderLibraryItems()}
          <div className="publish-library__fields">
            <label>
              <div>
                <span>{t("publishDialog.libraryName")}</span>
                <span aria-hidden="true" className="required">
                  *
                </span>
              </div>
              <input
                name="name"
                onChange={onInputChange}
                placeholder={t("publishDialog.placeholder.libraryName")}
                required
                type="text"
                value={libraryData.name}
              />
            </label>
            <label style={{ alignItems: "flex-start" }}>
              <div>
                <span>{t("publishDialog.libraryDesc")}</span>
                <span aria-hidden="true" className="required">
                  *
                </span>
              </div>
              <textarea
                name="description"
                onChange={onInputChange}
                placeholder={t("publishDialog.placeholder.libraryDesc")}
                required
                rows={4}
                value={libraryData.description}
              />
            </label>
            <label>
              <div>
                <span>{t("publishDialog.authorName")}</span>
                <span aria-hidden="true" className="required">
                  *
                </span>
              </div>
              <input
                name="authorName"
                onChange={onInputChange}
                placeholder={t("publishDialog.placeholder.authorName")}
                required
                type="text"
                value={libraryData.authorName}
              />
            </label>
            <label>
              <span>{t("publishDialog.githubUsername")}</span>
              <input
                name="githubHandle"
                onChange={onInputChange}
                placeholder={t("publishDialog.placeholder.githubHandle")}
                type="text"
                value={libraryData.githubHandle}
              />
            </label>
            <label>
              <span>{t("publishDialog.twitterUsername")}</span>
              <input
                name="twitterHandle"
                onChange={onInputChange}
                placeholder={t("publishDialog.placeholder.twitterHandle")}
                type="text"
                value={libraryData.twitterHandle}
              />
            </label>
            <label>
              <span>{t("publishDialog.website")}</span>
              <input
                name="website"
                onChange={onInputChange}
                pattern="https?://.+"
                placeholder={t("publishDialog.placeholder.website")}
                title={t("publishDialog.errors.website")}
                type="text"
                value={libraryData.website}
              />
            </label>
            <span className="publish-library-note">
              <Trans
                i18nKey="publishDialog.noteLicense"
                link={(el) => (
                  <a
                    href="https://github.com/excalidraw/excalidraw-libraries/blob/main/LICENSE"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {el}
                  </a>
                )}
              />
            </span>
          </div>
          <div className="publish-library__buttons">
            <DialogActionButton
              data-testid="cancel-clear-canvas-button"
              label={t("buttons.cancel")}
              onClick={onDialogClose}
            />
            <DialogActionButton
              actionType="primary"
              isLoading={isSubmitting}
              label={t("buttons.submit")}
              type="submit"
            />
          </div>
        </form>
      ) : (
        <p style={{ padding: "1em", textAlign: "center", fontWeight: 500 }}>
          {t("publishDialog.atleastOneLibItem")}
        </p>
      )}
    </Dialog>
  );
};

export default PublishLibrary;
