import clsx from "clsx";
import React from "react";
import useResizeObserver from "use-resize-observer";

import { useCanvas, useFabric } from "../../hooks";
import Actions from "../layers/layer/actions";
import styles from "./canvas.module.scss";
import Overlay from "./overlay";

const Canvas = (): React.ReactElement => {
  const fabricRef = useFabric();
  const canvas = useCanvas();
  const { ref, width = 1, height = 1 } = useResizeObserver();

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
      <canvas className={styles.canvas} ref={fabricRef} />
      <Overlay />
      <Actions />
    </div>
  );
};

export default Canvas;
