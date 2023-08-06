import clsx from "clsx";
import React from "react";
import { useDropzone } from "react-dropzone";

import Button from "~/components/Button";
import Input from "~/components/Input";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import CameraIllustration from "~/illustrations/Camera";

import styles from "./Uploads.module.scss";

type FileWithPreview = File & { preview: string };

const UploadsTab = (): React.ReactElement => {
  const toast = useToast();
  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      maxFiles: 1,
      accept: {
        "image/jpeg": [],
        "image/apng": [],
        "image/png": [],
        "image/gif": [],
        "image/webp": [],
        "image/avif": []
      },
      onError: () => toast("Unable to import the image file", "error"),
      onDrop: (acceptedFiles) => {
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file)
          })
        );
      }
    });
  const file = acceptedFiles[0] as FileWithPreview;

  return (
    <div
      className={clsx("flex-col", "flex-center", styles.uploads)}
      tabIndex={-1}
    >
      {file ? (
        <React.Fragment>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={""}
            className={styles.preview}
            onLoad={(): void => {
              // Revoke data uri after the image is loaded
              URL.revokeObjectURL(file.preview);
            }}
            src={file.preview}
          />
          <Spacer orientation={"vertical"} size={3} />
          <Input placeholder={"Add an alt text"} />
          <Spacer orientation={"vertical"} size={1.5} />
          <div className={"flex-center"}>
            <Button variant={"hollow"}>Upload</Button>
            <Spacer />
            <Button variant={"hollow"}>Open in whiteboard</Button>
          </div>
        </React.Fragment>
      ) : (
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
