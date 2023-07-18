import { ImageMime, NonImageMime } from "../../../../constants";
import { EditorClassProperties } from "../../../../types";
import { BinaryFiles, FileId } from "../../../../types";
import { loadHTMLImageElement } from "../loadHTMLImageElement";

/**
 * Updates cache, even if already populated with given image. Thus, you
 * should filter out the images upstream if you want to optimize this
 * @param fileIds File IDS
 * @param files Binary files
 * @param imageCache Image cache
 */
export const updateImageCache = async ({
  fileIds,
  files,
  imageCache
}: {
  fileIds: FileId[];
  files: BinaryFiles;
  imageCache: EditorClassProperties["imageCache"];
}): Promise<{
  erroredFiles: Map<FileId, true>;
  imageCache: Map<
    FileId,
    {
      image: HTMLImageElement | Promise<HTMLImageElement>;
      mimeType: ImageMime;
    }
  >;
  updatedFiles: Map<FileId, true>;
}> => {
  const updatedFiles = new Map<FileId, true>();
  const erroredFiles = new Map<FileId, true>();

  await Promise.all(
    fileIds.reduce((promises, fileId) => {
      const fileData = files[fileId as string];

      if (fileData && !updatedFiles.has(fileId)) {
        updatedFiles.set(fileId, true);

        return promises.concat(
          (async (): Promise<void> => {
            try {
              if (fileData.mimeType === NonImageMime.BINARY) {
                throw new Error("Only images can be added to ImageCache");
              }

              const imagePromise = loadHTMLImageElement(fileData.dataURL);
              const data = {
                image: imagePromise,
                mimeType: fileData.mimeType
              } as const;

              // Store the promise immediately to indicate there's an in-progress
              // initialization
              imageCache.set(fileId, data);
              const image = await imagePromise;
              imageCache.set(fileId, { ...data, image });
            } catch (error: any) {
              erroredFiles.set(fileId, true);
            }
          })()
        );
      }

      return promises;
    }, [] as Promise<any>[])
  );

  return {
    imageCache,
    // Includes errored files because their cache was updated nonetheless
    updatedFiles,
    // Files that failed when creating HTMLImageElement
    erroredFiles
  };
};
