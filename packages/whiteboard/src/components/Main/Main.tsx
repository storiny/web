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

const Main = (props: WhiteboardProps): React.ReactElement => {
  const { className, onConfirm, onCancel, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx("full-h", "full-w", styles.x, styles.main, className)}
    >
      <Provider>
        <WhiteboardProvider value={{ onConfirm, onCancel }}>
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
};

export default Main;
