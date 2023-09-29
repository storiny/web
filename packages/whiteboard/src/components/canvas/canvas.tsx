import clsx from "clsx";
import React from "react";
import use_resize_observer from "use-resize-observer";

import { use_canvas, use_fabric } from "../../hooks";
import Actions from "../layers/layer/actions";
import styles from "./canvas.module.scss";
import Overlay from "./overlay";

const Canvas = (): React.ReactElement => {
  const fabric_ref = use_fabric();
  const canvas = use_canvas();
  const { ref, width = 1, height = 1 } = use_resize_observer();

  React.useEffect(() => {
    canvas.current?.setDimensions({ height, width });
  }, [canvas, height, width]);

  return (
    <div className={styles["canvas-container"]} ref={ref}>
      <div
        aria-hidden
        className={clsx("invert", styles["canvas-background"])}
        tabIndex={-1}
      />
      <canvas className={styles.canvas} ref={fabric_ref} />
      <Overlay />
      <Actions />
    </div>
  );
};

export default Canvas;
