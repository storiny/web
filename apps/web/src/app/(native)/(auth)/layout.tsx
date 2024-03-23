import { clsx } from "clsx";
import React from "react";

import PlusPattern from "~/brand/plus-pattern";
import Navbar from "~/layout/navbar";
import css from "~/theme/main.module.scss";

import styles from "./layout.module.scss";
import AuthState from "./state";

const AuthLayout = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={clsx(css.grid, css["grid-container"], css.minimal)}>
    <Navbar variant={"minimal"} />
    <div
      className={clsx(css["full-w"], css["full-h"])}
      role={"presentation"}
      style={{ minHeight: "100vh", position: "fixed", pointerEvents: "none" }}
    >
      <PlusPattern />
    </div>
    {/* Need to make the <main /> styles more specific */}
    <main className={clsx(styles.x, styles.main)} data-root={"true"}>
      <div className={clsx(css["flex-col"], styles.container)}>
        <AuthState>{children}</AuthState>
      </div>
    </main>
  </div>
);

export { metadata } from "./metadata";
export default AuthLayout;
