import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import NavigationItem from "~/components/navigation-item";
import Separator from "~/components/separator";
import AlbumIcon from "~/icons/album";
import PexelsIcon from "~/icons/pexels";
import UploadIcon from "~/icons/upload";

import { nav_segment_atom } from "../../atoms";
import styles from "./navigation-screen.module.scss";

const NavigationScreen = (): React.ReactElement => {
  const set_nav_segment = use_set_atom(nav_segment_atom);
  return (
    <div className={clsx("flex-col", styles["navigation-screen"])}>
      <div className={clsx("flex-col", styles["item-container"])}>
        <NavigationItem
          decorator={<PexelsIcon />}
          onClick={(): void => set_nav_segment("pexels")}
        >
          Pexels
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<AlbumIcon />}
          onClick={(): void => set_nav_segment("library")}
        >
          Library
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<UploadIcon />}
          onClick={(): void => set_nav_segment("upload")}
        >
          Upload
        </NavigationItem>
      </div>
    </div>
  );
};

export default NavigationScreen;
