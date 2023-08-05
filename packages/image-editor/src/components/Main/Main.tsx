import clsx from "clsx";
import { initFilterBackend, setFilterBackend } from "fabric";
import { Provider } from "jotai";
import React from "react";

import Canvas from "../Canvas";
import FabricProvider from "../Context";
import Panel from "../Panel";
import Tools from "../Tools";
import Topbar from "../Topbar";
import styles from "./Main.module.scss";
import { ImageEditorProps } from "./Main.props";

const Main = ({ className, ...rest }: ImageEditorProps): React.ReactElement => {
  React.useEffect(() => {
    setFilterBackend(initFilterBackend());
  }, []);

  return (
    <div
      {...rest}
      className={clsx("full-h", "full-w", styles.x, styles.main, className)}
    >
      <Provider>
        <FabricProvider>
          <Topbar />
          <Tools />
          <Canvas />
          <Panel />
        </FabricProvider>
      </Provider>
    </div>
  );
};

export default Main;
