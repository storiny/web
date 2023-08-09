import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import Button from "~/components/Button";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { selectedAtom } from "~/entities/Gallery/core/atoms";
import { useAssetUploadMutation } from "~/redux/features";
import { getCdnUrl } from "~/utils/getCdnUrl";

import UploadProgress from "../../UploadProgress";
import styles from "./Uploader.module.scss";
import { WhiteboardUploaderProps } from "./Uploader.props";

const WhiteboardUploader = (
  props: WhiteboardUploaderProps
): React.ReactElement => {
  const { file, alt, onReset } = props;
  const setSelected = useSetAtom(selectedAtom);
  const toast = useToast();
  const [uploadImage, result] = useAssetUploadMutation();

  /**
   * Handles the uploading of the image
   */
  const handleUpload = React.useCallback(() => {
    uploadImage({ file, alt })
      .unwrap()
      .then((res) => {
        setSelected({
          src: getCdnUrl(res.key, ImageSize.W_320),
          id: String(res.id),
          hex: res.hex,
          source: "native"
        });
      })
      .catch((e) => {
        if (e?.data?.error) {
          toast(e.data.error, "error");
        }
      });
  }, [alt, file, setSelected, toast, uploadImage]);

  /**
   * Resets the component
   */
  const reset = React.useCallback(() => {
    setSelected(null);
    if (onReset) {
      onReset();
    }
  }, [onReset, setSelected]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => handleUpload(), []);

  return (
    <div
      className={clsx("flex-col", "flex-center", styles.uploader)}
      tabIndex={-1}
    >
      {result.isLoading ? (
        // Loading area
        <div className={clsx("flex-col", "flex-center")}>
          <Typography className={"t-medium"} level={"body3"}>
            Uploading sketch...
          </Typography>
          <Spacer orientation={"vertical"} size={1.5} />
          <UploadProgress />
        </div>
      ) : result.isError ? (
        // Upload error area
        <React.Fragment>
          <Typography className={clsx("t-minor", "t-center")} level={"body2"}>
            Failed to upload your sketch
          </Typography>
          <Spacer orientation={"vertical"} size={2.25} />
          <div className={"flex-center"}>
            <Button onClick={handleUpload}>Try again</Button>
          </div>
        </React.Fragment>
      ) : (
        // Upload success area
        <React.Fragment>
          <Typography className={clsx("t-minor", "t-center")} level={"body2"}>
            Sketch uploaded
          </Typography>
          <Spacer orientation={"vertical"} size={2.25} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={""}
            className={styles.preview}
            onLoad={(): void => URL.revokeObjectURL((file as any).preview)}
            src={(file as any).preview}
          />
          <Spacer orientation={"vertical"} size={2.25} />
          <div className={"flex-center"}>
            <Button onClick={reset} variant={"hollow"}>
              Sketch another
            </Button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default WhiteboardUploader;
