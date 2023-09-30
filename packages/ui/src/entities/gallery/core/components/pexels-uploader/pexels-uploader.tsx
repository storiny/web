import clsx from "clsx";
import { useAtom as use_atom, useSetAtom as use_set_atom } from "jotai";
import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import {
  pending_image_atom,
  uploading_atom
} from "~/entities/gallery/core/atoms";
import { use_upload_gallery_mutation } from "~/redux/features";

import UploadProgress from "../upload-progress";
import styles from "./pexels-uploader.module.scss";
import { PexelsUploaderProps } from "./pexels-uploader.props";

const PexelsUploader = (props: PexelsUploaderProps): React.ReactElement => {
  const { on_upload_finish } = props;
  const [pending_image, set_pending_image] = use_atom(pending_image_atom);
  const set_uploading = use_set_atom(uploading_atom);
  const [upload_image, result] = use_upload_gallery_mutation();

  /**
   * Handles the uploading of the image
   */
  const handle_upload = React.useCallback(() => {
    set_uploading(true);
    upload_image({ id: pending_image || "" })
      .unwrap()
      .then(on_upload_finish)
      .then(() => set_pending_image(null))
      .catch(() => undefined)
      .finally(() => set_uploading(false));
  }, [
    on_upload_finish,
    pending_image,
    set_pending_image,
    set_uploading,
    upload_image
  ]);

  // Upload on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(handle_upload, []);

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
            <Button onClick={handle_upload}>Try again</Button>
          </div>
        </React.Fragment>
      ) : null}
    </div>
  );
};

export default PexelsUploader;
