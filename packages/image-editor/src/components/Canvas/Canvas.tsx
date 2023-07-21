import React from "react";
import useResizeObserver from "use-resize-observer";

import { useCanvas, useFabric } from "../../hooks";
import styles from "./Canvas.module.scss";
import Overlay from "./Overlay";

const Canvas = (): React.ReactElement => {
  const fabricRef = useFabric();
  const canvas = useCanvas();
  const { ref, width = 1, height = 1 } = useResizeObserver();

  React.useEffect(() => {
    canvas.current?.setDimensions({ height, width });
  }, [canvas, height, width]);

  return (
    <div className={styles["canvas-container"]} ref={ref}>
      <canvas className={styles.canvas} ref={fabricRef} />
      <Overlay />
    </div>
  );
};

export default Canvas;
