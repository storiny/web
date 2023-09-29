import clsx from "clsx";
import { Provider } from "jotai";
import React from "react";

import Canvas from "../canvas";
import { FabricProvider, WhiteboardProvider } from "../context";
import Panel from "../panel";
import Tools from "../tools";
import Topbar from "../topbar";
import styles from "./whiteboard.module.scss";
import { WhiteboardProps } from "./whiteboard.props";

const Main = React.forwardRef<HTMLDivElement, WhiteboardProps>((props, ref) => {
  const {
    className,
    onMount,
    on_confirm,
    on_cancel,
    initialImageUrl,
    ...rest
  } = props;

  React.useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);

  return (
    <div
      {...rest}
      className={clsx("full-h", "full-w", styles.x, styles.main, className)}
      ref={ref}
    >
      <Provider>
        <WhiteboardProvider value={{ on_confirm, on_cancel, initialImageUrl }}>
          <FabricProvider>
            <Topbar />
            <Tools />
            <Canvas />
            <Panel />
          </FabricProvider>
        </WhiteboardProvider>
      </Provider>
    </div>
  );
});

Main.displayName = "Whiteboard";

export default Main;
