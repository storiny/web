import { clsx } from "clsx";
import React from "react";

import Typography from "../../../../ui/src/components/typography";

import styles from "./placeholder.module.scss";

const EditorPlaceholder = (): React.ReactElement => (
  <Typography
    as={"span"}
    className={clsx(styles.x, styles.placeholder)}
    data-testid={"placeholder"}
    ellipsis
    level={"legible"}
  >
    Share your story…
  </Typography>
);

export default EditorPlaceholder;
