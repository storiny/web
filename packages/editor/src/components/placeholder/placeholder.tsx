import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/Typography";

import styles from "./placeholder.module.scss";

const EditorPlaceholder = (): React.ReactElement => (
  <Typography
    as={"span"}
    className={clsx(styles.x, styles.placeholder)}
    ellipsis
    level={"legible"}
  >
    Share your story…
  </Typography>
);

export default EditorPlaceholder;
