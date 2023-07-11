import clsx from "clsx";
import { Provider } from "jotai";
import React from "react";

import Canvas from "../Canvas";
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
    <Provider>
      <Topbar />
      <Tabs />
      <Canvas />
      <Tools />
    </Provider>
  </div>
);

export default Main;
