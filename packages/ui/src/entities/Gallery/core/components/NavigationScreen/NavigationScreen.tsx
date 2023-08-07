import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import NavigationItem from "~/components/NavigationItem";
import Separator from "~/components/Separator";
import AlbumIcon from "~/icons/Album";
import PexelsIcon from "~/icons/Pexels";
import UploadIcon from "~/icons/Upload";

import { navSegmentAtom } from "../../atoms";
import styles from "./NavigationScreen.module.scss";

const NavigationScreen = (): React.ReactElement => {
  const setNavSegment = useSetAtom(navSegmentAtom);
  return (
    <div className={clsx("flex-col", styles["navigation-screen"])}>
      <div className={clsx("flex-col", styles["item-container"])}>
        <NavigationItem
          decorator={<PexelsIcon />}
          onClick={(): void => setNavSegment("pexels")}
        >
          Pexels
        </NavigationItem>
        <Separator invertMargin />
        <NavigationItem
          decorator={<AlbumIcon />}
          onClick={(): void => setNavSegment("library")}
        >
          Library
        </NavigationItem>
        <Separator invertMargin />
        <NavigationItem
          decorator={<UploadIcon />}
          onClick={(): void => setNavSegment("upload")}
        >
          Upload
        </NavigationItem>
      </div>
    </div>
  );
};

export default NavigationScreen;
