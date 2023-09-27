import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";
import { ErrorCode, useDropzone } from "react-dropzone";

import Button from "~/components/Button";
import Input from "~/components/Input";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import CameraIllustration from "~/illustrations/Camera";
import { use_upload_asset_mutation } from "~/redux/features";
import { getCdnUrl } from "~/utils/getCdnUrl";

import { selectedAtom, uploadingAtom } from "../../atoms";
import { FileWithPreview } from "../../types";
import UploadProgress from "../upload-progress";
import styles from "./uploads.module.scss";
import { UploadsProps } from "./uploads.props";

// Max image size
const TEN_MB_IN_BYTES = 1_04_85_760;

const UploadsTab = (props: UploadsProps): React.ReactElement => {
  const { onOpenInWhiteboard, disableWhiteboardPrompt } = props;
  const toast = useToast();
  const setSelected = useSetAtom(selectedAtom);
  const setUploading = useSetAtom(uploadingAtom);
  const [file, setFile] = React.useState<FileWithPreview | null>(null);
  const [alt, setAlt] = React.useState<string>("");
  const [uploadImage, result] = use_upload_asset_mutation();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length) {
        let errorMessage = "";

        for (const rejection of fileRejections) {
          for (const error of rejection.errors) {
            switch (error.code) {
              case ErrorCode.FileInvalidType:
                errorMessage = "Unsupported image file";
                break;
              case ErrorCode.FileTooLarge:
                errorMessage = "Image file is too large";
                break;
              case ErrorCode.TooManyFiles:
                errorMessage =
                  "Only a single image file can be uploaded at a time";
                break;
              default:
                errorMessage = "Unable to import the image file";
            }
          }
        }

        toast(errorMessage, "error");
      } else {
        const acceptedFile = acceptedFiles[0] as File;

        if (acceptedFile) {
          Object.assign(acceptedFile, {
            preview: URL.createObjectURL(acceptedFile)
          });

          setFile(acceptedFile as FileWithPreview);
        } else {
          toast("No file selected", "error");
        }
      }
    }
  });

  /**
   * Handles the uploading of the image
   */
  const handleUpload = React.useCallback(() => {
    if (file) {
      setUploading(true);
      uploadImage({ file, alt })
        .unwrap()
        .then((uploaded) => {
          setAlt("");
          setSelected({
            src: getCdnUrl(uploaded.key, ImageSize.W_320),
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
        .finally(() => setUploading(false));
    }
  }, [alt, file, setSelected, setUploading, uploadImage]);

  /**
   * Resets the component
   */
  const reset = React.useCallback(() => {
    setFile(null);
    setSelected(null);
    result.reset();
  }, [result, setSelected]);

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
            <Button onClick={handleUpload}>Try again</Button>
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
            onChange={(event): void => setAlt(event.target.value)}
            placeholder={"Add an alt text"}
            value={alt}
          />
          <Spacer orientation={"vertical"} size={1.5} />
          <div className={"flex-center"}>
            {!disableWhiteboardPrompt && (
              <React.Fragment>
                <Button
                  onClick={(): void => onOpenInWhiteboard?.(file.preview)}
                  variant={"hollow"}
                >
                  Open in whiteboard
                </Button>
                <Spacer />
              </React.Fragment>
            )}
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        </React.Fragment>
      ) : (
        // Main drop area
        <div
          {...getRootProps({
            className: clsx(
              "focusable",
              "focus-invert",
              "flex-col",
              "flex-center",
              styles.dropzone,
              isDragActive && styles.focused
            )
          })}
        >
          <input {...getInputProps()} />
          <CameraIllustration className={styles.illustration} />
          <Typography level={"body2"}>
            {isDragActive ? "Drop it!" : "Drop file here or click to upload"}
          </Typography>
        </div>
      )}
    </div>
  );
};

export default UploadsTab;
