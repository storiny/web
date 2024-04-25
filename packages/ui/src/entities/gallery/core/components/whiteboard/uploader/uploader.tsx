import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { selected_atom } from "~/entities/gallery/core/atoms";
import { use_upload_asset_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { handle_api_error } from "~/utils/handle-api-error";

import UploadProgress from "../../upload-progress";
import styles from "./uploader.module.scss";
import { WhiteboardUploaderProps } from "./uploader.props";

const WhiteboardUploader = (
  props: WhiteboardUploaderProps
): React.ReactElement => {
  const { file, alt, on_reset } = props;
  const set_selected = use_set_atom(selected_atom);
  const toast = use_toast();
  const [upload_image, result] = use_upload_asset_mutation();
  const started_uploading_ref = React.useRef<boolean>(false);

  /**
   * Handles the uploading of the image
   */
  const handle_upload = React.useCallback(() => {
    if (started_uploading_ref.current) {
      return;
    }

    started_uploading_ref.current = true;

    upload_image({ file, alt })
      .unwrap()
      .then((res) => {
        set_selected({
          src: get_cdn_url(res.key, ImageSize.W_320),
          key: res.key,
          hex: res.hex,
          alt: res.alt,
          rating: res.rating,
          width: res.width,
          height: res.height,
          source: "native"
        });
      })
      .catch((error) => {
        handle_api_error(error, toast, null, "Could not upload your sketch");
      })
      .finally(() => {
        started_uploading_ref.current = false;
      });
  }, [alt, file, set_selected, toast, upload_image]);

  /**
   * Resets the component
   */
  const reset = React.useCallback(() => {
    set_selected(null);
    if (on_reset) {
      on_reset();
    }
  }, [on_reset, set_selected]);

  // Upload on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(handle_upload, []);

  return (
    <div
      className={clsx(css["flex-col"], css["flex-center"], styles.uploader)}
      tabIndex={-1}
    >
      {result.isLoading ? (
        // Loading area
        <div className={clsx(css["flex-col"], css["flex-center"])}>
          <Typography level={"body3"} weight={"medium"}>
            Uploading sketch...
          </Typography>
          <Spacer orientation={"vertical"} size={1.5} />
          <UploadProgress />
        </div>
      ) : result.isError ? (
        // Upload error area
        <React.Fragment>
          <Typography
            className={css["t-center"]}
            color={"minor"}
            level={"body2"}
          >
            {"data" in result.error &&
            typeof (result.error?.data as any)?.error === "string"
              ? (result.error.data as any).error
              : "Failed to upload your sketch"}
          </Typography>
          {/* Do not allow to retry the upload if the daily upload limit has been reached */}
          {(result.error as any)?.status === 429 ? null : (
            <>
              <Spacer orientation={"vertical"} size={2.25} />
              <div className={css["flex-center"]}>
                <Button onClick={handle_upload}>Try again</Button>
              </div>
            </>
          )}
        </React.Fragment>
      ) : (
        // Upload success area
        <React.Fragment>
          <Typography
            className={css["t-center"]}
            color={"minor"}
            level={"body2"}
          >
            Sketch uploaded
          </Typography>
          <Spacer orientation={"vertical"} size={2.25} />
          <img
            alt={""}
            className={styles.preview}
            onLoad={(): void => URL.revokeObjectURL((file as any).preview)}
            src={(file as any).preview}
          />
          <Spacer orientation={"vertical"} size={2.25} />
          <div className={css["flex-center"]}>
            <Button onClick={reset} variant={"hollow"}>
              Create another sketch
            </Button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default WhiteboardUploader;
