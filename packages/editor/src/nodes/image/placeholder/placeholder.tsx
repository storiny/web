import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/Typography";

import styles from "./placeholder.module.scss";

const ImagePlaceholder = (): React.ReactElement => (
  <Typography
    as={"span"}
    className={clsx(styles.x, styles.placeholder)}
    ellipsis
    level={"legible"}
  >
    Enter a caption…
  </Typography>
);

export default ImagePlaceholder;
