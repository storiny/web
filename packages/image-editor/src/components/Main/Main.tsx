import clsx from "clsx";
import React from "react";

import Tabs from "../Tabs";
import styles from "./Main.module.scss";

const Main = (): React.ReactElement => (
  <div className={clsx(styles.x, styles.main)}>
    <Tabs />
  </div>
);

export default Main;
