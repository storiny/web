import clsx from "clsx";
import React from "react";
import { Provider } from "react-redux";

import { editorStore } from "../../store";
import Canvas from "../Canvas";
import FabricProvider from "../Context";
import Tabs from "../Tabs";
import Tools from "../Tools";
import Topbar from "../Topbar";
import styles from "./Main.module.scss";
import { ImageEditorProps } from "./Main.props";

const Main = ({ className, ...rest }: ImageEditorProps): React.ReactElement => (
  <div
    {...rest}
    className={clsx("full-h", "full-w", styles.x, styles.main, className)}
  >
    <FabricProvider>
      <Provider store={editorStore}>
        <Topbar />
        <Tabs />
        <Canvas />
        <Tools />
      </Provider>
    </FabricProvider>
  </div>
);

export default Main;
