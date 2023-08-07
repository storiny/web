import clsx from "clsx";
import { Provider } from "jotai";
import React from "react";

import Canvas from "../Canvas";
import { FabricProvider, WhiteboardProvider } from "../Context";
import Panel from "../Panel";
import Tools from "../Tools";
import Topbar from "../Topbar";
import styles from "./Main.module.scss";
import { WhiteboardProps } from "./Main.props";

const Main = React.forwardRef<HTMLDivElement, WhiteboardProps>((props, ref) => {
  const { className, onMount, onConfirm, onCancel, initialImageUrl, ...rest } =
    props;

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
        <WhiteboardProvider value={{ onConfirm, onCancel, initialImageUrl }}>
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
