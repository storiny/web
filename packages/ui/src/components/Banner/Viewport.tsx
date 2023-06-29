"use client";

import { Viewport } from "@radix-ui/react-toast";
import React from "react";

import styles from "./Banner.module.scss";

const BannerViewport = () => (
  <Viewport
    className={styles.viewport}
    hotkey={["F10"]}
    label={"Background notifications ({hotkey})"}
  />
);

export default BannerViewport;
