import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import NavigationItem from "~/components/NavigationItem";
import Separator from "~/components/Separator";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/Settings";

import { navSegmentAtom } from "../../atoms";
import styles from "./navigation-screen.module.scss";

const NavigationScreen = (): React.ReactElement => {
  const setNavSegment = useSetAtom(navSegmentAtom);
  return (
    <div className={"flex-col"}>
      <div className={clsx("flex-col", styles["item-container"])}>
        <NavigationItem
          decorator={<FileIcon />}
          onClick={(): void => setNavSegment("general")}
        >
          General
        </NavigationItem>
        <Separator invertMargin />
        <NavigationItem
          decorator={<SeoIcon />}
          onClick={(): void => setNavSegment("seo")}
        >
          SEO
        </NavigationItem>
        <Separator invertMargin />
        <NavigationItem
          decorator={<LicenseIcon />}
          onClick={(): void => setNavSegment("license")}
        >
          License
        </NavigationItem>
        <Separator invertMargin />
        <NavigationItem
          decorator={<SettingsIcon />}
          onClick={(): void => setNavSegment("settings")}
        >
          Settings
        </NavigationItem>
      </div>
    </div>
  );
};

export default NavigationScreen;
