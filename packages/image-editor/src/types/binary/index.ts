import { ImageMime, NonImageMime } from "../../constants";
import { FileId } from "../layer";

export type BinaryFileData = {
  /**
   * Epoch timestamp in milliseconds
   */
  createdAt: number;
  dataURL: string;
  id: FileId;
  mimeType:
    | ImageMime
    // Unknown file type
    | typeof NonImageMime.BINARY;
};

export type BinaryFileMetadata = Omit<BinaryFileData, "dataURL">;
export type BinaryFiles = Record<string, BinaryFileData>;
