import clsx from "clsx";
import { useAtom, useSetAtom } from "jotai";
import React from "react";

import Button from "~/components/Button";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { pendingImageAtom, uploadingAtom } from "~/entities/gallery/core/atoms";
import { useGalleryUploadMutation } from "~/redux/features";

import UploadProgress from "../upload-progress";
import styles from "./pexels-uploader.module.scss";
import { PexelsUploaderProps } from "./pexels-uploader.props";

const PexelsUploader = (props: PexelsUploaderProps): React.ReactElement => {
  const { onUploadFinish } = props;
  const [pendingImage, setPendingImage] = useAtom(pendingImageAtom);
  const setUploading = useSetAtom(uploadingAtom);
  const [uploadImage, result] = useGalleryUploadMutation();

  /**
   * Handles the uploading of the image
   */
  const handleUpload = React.useCallback(() => {
    setUploading(true);
    uploadImage({ id: pendingImage || "" })
      .unwrap()
      .then(onUploadFinish)
      .then(() => setPendingImage(null))
      .catch(() => undefined)
      .finally(() => setUploading(false));
  }, [
    onUploadFinish,
    pendingImage,
    setPendingImage,
    setUploading,
    uploadImage
  ]);

  // Upload on mount
  React.useEffect(handleUpload, [handleUpload]);

  return (
    <div
      className={clsx("flex-col", "flex-center", styles.uploads)}
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
            Failed to upload the pexels image
          </Typography>
          <Spacer orientation={"vertical"} size={2.25} />
          <div className={"flex-center"}>
            <Button variant={"hollow"}>Cancel</Button>
            <Spacer />
            <Button onClick={handleUpload}>Try again</Button>
          </div>
        </React.Fragment>
      ) : null}
    </div>
  );
};

export default PexelsUploader;
