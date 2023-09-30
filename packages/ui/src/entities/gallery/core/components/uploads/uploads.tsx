import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";
import { ErrorCode, useDropzone as use_dropzone } from "react-dropzone";

import Button from "~/components/button";
import Input from "~/components/input";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import CameraIllustration from "~/illustrations/camera";
import { use_upload_asset_mutation } from "~/redux/features";
import { get_cdn_url } from "~/utils/get-cdn-url";

import { selected_atom, uploading_atom } from "../../atoms";
import { FileWithPreview } from "../../types";
import UploadProgress from "../upload-progress";
import styles from "./uploads.module.scss";
import { UploadsProps } from "./uploads.props";

// Max image size
const TEN_MB_IN_BYTES = 1_04_85_760;

const UploadsTab = (props: UploadsProps): React.ReactElement => {
  const { on_open_in_whiteboard, disable_whiteboard_prompt } = props;
  const toast = use_toast();
  const set_selected = use_set_atom(selected_atom);
  const set_uploading = use_set_atom(uploading_atom);
  const [file, set_file] = React.useState<FileWithPreview | null>(null);
  const [alt, set_alt] = React.useState<string>("");
  const [upload_image, result] = use_upload_asset_mutation();
  const {
    getRootProps: get_root_props,
    getInputProps: get_input_props,
    isDragActive: is_drag_active
  } = use_dropzone({
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    maxFiles: 1,
    maxSize: TEN_MB_IN_BYTES,
    multiple: false,
    autoFocus: true,
    accept: {
      "image/jpeg": [],
      "image/apng": [],
      "image/png": [],
      "image/gif": [],
      "image/webp": [],
      "image/avif": []
    },
    onError: () => toast("Unable to import the image file", "error"),
    /* eslint-enable prefer-snakecase/prefer-snakecase */
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onDrop: (accepted_files, file_rejections) => {
      if (file_rejections.length) {
        let error_message = "";

        for (const rejection of file_rejections) {
          for (const error of rejection.errors) {
            switch (error.code) {
              case ErrorCode.FileInvalidType:
                error_message = "Unsupported image file";
                break;
              case ErrorCode.FileTooLarge:
                error_message = "Image file is too large";
                break;
              case ErrorCode.TooManyFiles:
                error_message =
                  "Only a single image file can be uploaded at a time";
                break;
              default:
                error_message = "Unable to import the image file";
            }
          }
        }

        toast(error_message, "error");
      } else {
        const accepted_file = accepted_files[0] as File;

        if (accepted_file) {
          Object.assign(accepted_file, {
            preview: URL.createObjectURL(accepted_file)
          });

          set_file(accepted_file as FileWithPreview);
        } else {
          toast("No file selected", "error");
        }
      }
    }
  });

  /**
   * Handles the uploading of the image
   */
  const handle_upload = React.useCallback(() => {
    if (file) {
      set_uploading(true);
      upload_image({ file, alt })
        .unwrap()
        .then((uploaded) => {
          set_alt("");
          set_selected({
            src: get_cdn_url(uploaded.key, ImageSize.W_320),
            key: uploaded.key,
            hex: uploaded.hex,
            alt: uploaded.alt,
            width: uploaded.width,
            height: uploaded.height,
            rating: uploaded.rating,
            source: "native"
          });
        })
        .catch(() => undefined)
        .finally(() => set_uploading(false));
    }
  }, [alt, file, set_selected, set_uploading, upload_image]);

  /**
   * Resets the component
   */
  const reset = React.useCallback(() => {
    set_file(null);
    set_selected(null);
    result.reset();
  }, [result, set_selected]);

  return (
    <div
      className={clsx("flex-col", "flex-center", styles.uploads)}
      data-has-file={String(
        Boolean(result.isLoading || result.isSuccess || file)
      )}
      tabIndex={-1}
    >
      {result.isLoading ? (
        // Loading area
        <div className={clsx("flex-col", "flex-center")}>
          <Typography className={"t-medium"} level={"body3"}>
            Uploading image...
          </Typography>
          <Spacer orientation={"vertical"} size={1.5} />
          <UploadProgress />
        </div>
      ) : result.isError ? (
        // Uplaod error area
        <React.Fragment>
          <Typography className={clsx("t-minor", "t-center")} level={"body2"}>
            Failed to upload your image
          </Typography>
          <Spacer orientation={"vertical"} size={2.25} />
          <div className={"flex-center"}>
            <Button onClick={handle_upload}>Try again</Button>
          </div>
        </React.Fragment>
      ) : result.isSuccess && file ? (
        // Upload success area
        <React.Fragment>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={""}
            className={styles.preview}
            onLoad={(): void => URL.revokeObjectURL(file.preview)}
            src={file.preview}
          />
          <Spacer className={"f-grow"} orientation={"vertical"} size={2.25} />
          <Typography className={clsx("t-minor", "t-center")} level={"body2"}>
            Image uploaded
          </Typography>
          <Spacer orientation={"vertical"} size={2.25} />
          <div className={"flex-center"}>
            <Button onClick={reset} variant={"hollow"}>
              Upload another
            </Button>
          </div>
        </React.Fragment>
      ) : file ? (
        // File preview and actions area
        <React.Fragment>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={""} className={styles.preview} src={file.preview} />
          <Spacer className={"f-grow"} orientation={"vertical"} size={3} />
          <Input
            aria-label={"Alt text for the image"}
            onChange={(event): void => set_alt(event.target.value)}
            placeholder={"Add an alt text"}
            value={alt}
          />
          <Spacer orientation={"vertical"} size={1.5} />
          <div className={"flex-center"}>
            {!disable_whiteboard_prompt && (
              <React.Fragment>
                <Button
                  onClick={(): void => on_open_in_whiteboard?.(file.preview)}
                  variant={"hollow"}
                >
                  Open in whiteboard
                </Button>
                <Spacer />
              </React.Fragment>
            )}
            <Button onClick={handle_upload}>Upload</Button>
          </div>
        </React.Fragment>
      ) : (
        // Main drop area
        <div
          {...get_root_props({
            className: clsx(
              "focusable",
              "focus-invert",
              "flex-col",
              "flex-center",
              styles.dropzone,
              is_drag_active && styles.focused
            )
          })}
        >
          <input {...get_input_props()} />
          <CameraIllustration className={styles.illustration} />
          <Typography level={"body2"}>
            {is_drag_active ? "Drop it!" : "Drop file here or click to upload"}
          </Typography>
        </div>
      )}
    </div>
  );
};

export default UploadsTab;
