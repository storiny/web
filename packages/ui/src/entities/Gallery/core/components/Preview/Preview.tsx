import clsx from "clsx";
import React from "react";

import PhotoIcon from "~/icons/Photo";

import styles from "./Preview.module.scss";

const ImagePreview = (): React.ReactElement => (
  <div className={clsx("flex-center", styles.preview)}>
    <PhotoIcon />
  </div>
);

export default ImagePreview;
