import { devConsole } from "@storiny/shared/src/utils/devLog";
import {
  fileOpen as fileOpenImpl,
  fileSave as fileSaveImpl,
  supported as nativeFileSystemSupported
} from "browser-fs-access";

import { Event, ImageMime, Mime } from "../../../constants";
import { AbortError } from "../../errors";
import { debounce } from "../../utils";

const INPUT_CHANGE_INTERVAL_MS = 500;

/**
 * File open handler
 * @param opts Handler options
 */
export const fileOpen = <M extends boolean | undefined = false>(opts: {
  description: string;
  extensions?: string[];
  multiple?: M;
}): Promise<M extends false | undefined ? File : File[]> => {
  // An unsafe TS hack
  type RetType = M extends false | undefined ? File : File[];

  const mimeTypes = opts.extensions?.reduce((mimeTypes, type) => {
    mimeTypes.push((Mime as any)[type]);
    return mimeTypes;
  }, [] as string[]);

  const extensions = opts.extensions?.reduce((acc, ext) => {
    if (ext === ImageMime.JPG) {
      return acc.concat(".jpg", ".jpeg");
    }

    return acc.concat(`.${ext}`);
  }, [] as string[]);

  return fileOpenImpl({
    description: opts.description,
    extensions,
    mimeTypes,
    multiple: opts.multiple ?? false,
    legacySetup: (resolve, reject, input) => {
      const scheduleRejection = debounce(reject, INPUT_CHANGE_INTERVAL_MS);
      const focusHandler = (): void => {
        checkForFile();
        document.addEventListener(Event.KEYUP, scheduleRejection);
        document.addEventListener(Event.POINTER_UP, scheduleRejection);
        scheduleRejection();
      };

      const checkForFile = (): void => {
        // This hack might not work when expecting multiple files
        if (input.files?.length) {
          const ret = opts.multiple ? [...input.files] : input.files[0];
          resolve(ret as RetType);
        }
      };

      requestAnimationFrame(() => {
        window.addEventListener(Event.FOCUS, focusHandler);
      });

      const interval = window.setInterval(() => {
        checkForFile();
      }, INPUT_CHANGE_INTERVAL_MS);

      return (rejectPromise) => {
        clearInterval(interval);
        scheduleRejection.cancel();
        window.removeEventListener(Event.FOCUS, focusHandler);
        document.removeEventListener(Event.KEYUP, scheduleRejection);
        document.removeEventListener(Event.POINTER_UP, scheduleRejection);

        if (rejectPromise) {
          devConsole.warn("Opening the file was canceled (legacy-fs)");
          rejectPromise(new AbortError());
        }
      };
    }
  }) as Promise<RetType>;
};

/**
 * File save handler
 * @param blob Blob to save
 * @param opts Handler options
 */
export const fileSave = (
  blob: Blob,
  opts: {
    description: string;
    extension: string;
    // eslint-disable-next-line no-undef
    fileHandle?: FileSystemHandle | null;
    name: string;
  }
): ReturnType<typeof fileSaveImpl> =>
  fileSaveImpl(
    blob,
    {
      fileName: `${opts.name}.${opts.extension}`,
      description: opts.description,
      extensions: [`.${opts.extension}`]
    },
    opts.fileHandle as any
  );

export { nativeFileSystemSupported };
