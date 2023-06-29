import "server-only";

import { clsx } from "clsx";
import Image from "next/image";
import React from "react";

import Navbar from "~/layout/Navbar";

import styles from "./layout.module.scss";
import AuthState from "./state";

const AuthLayout = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <div className={"grid minimal"}>
    <Navbar variant={"minimal"} />
    <div
      className={clsx("full-w", "full-h")}
      role={"presentation"}
      style={{ minHeight: "100vh", position: "fixed", pointerEvents: "none" }}
    >
      <Image
        alt={""}
        className={"invert"}
        fill
        loading={"eager"}
        priority
        src={"web-assets/background/noise"}
        style={{ objectFit: "cover", opacity: 0.45 }}
      />
    </div>
    <main className={styles.main}>
      <div className={clsx("flex-col", styles.container)}>
        <AuthState>{children}</AuthState>
      </div>
    </main>
  </div>
);

export * from "./metadata";
export default AuthLayout;
