import React from "react";

import styles from "./Canvas.module.scss";
import Overlay from "./Overlay";

const Canvas = (): React.ReactLayer => (
  <div className={styles["canvas-container"]}>
    <canvas className={styles.canvas} />
    <Overlay />
  </div>
);

export default Canvas;
