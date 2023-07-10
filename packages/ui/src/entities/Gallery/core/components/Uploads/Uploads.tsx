import clsx from "clsx";
import React from "react";

import Typography from "~/components/Typography";
import CameraIllustration from "~/illustrations/Camera";

import styles from "./Uploads.module.scss";

const UploadsTab = (): React.ReactElement => (
  <div
    className={clsx("focusable", "flex-col", "flex-center", styles.uploads)}
    tabIndex={0}
  >
    <CameraIllustration className={styles.illustration} />
    <Typography level={"body2"}>Drop file here or click to upload</Typography>
  </div>
);

export default UploadsTab;
