import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import NavigationItem from "../../../../../../../ui/src/components/navigation-item";
import Separator from "../../../../../../../ui/src/components/separator";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/Settings";

import { nav_segment_atom } from "../../atoms";
import styles from "./navigation-screen.module.scss";

const NavigationScreen = (): React.ReactElement => {
  const setNavSegment = use_set_atom(nav_segment_atom);
  return (
    <div className={"flex-col"}>
      <div className={clsx("flex-col", styles["item-container"])}>
        <NavigationItem
          decorator={<FileIcon />}
          onClick={(): void => setNavSegment("general")}
        >
          General
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<SeoIcon />}
          onClick={(): void => setNavSegment("seo")}
        >
          SEO
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<LicenseIcon />}
          onClick={(): void => setNavSegment("license")}
        >
          License
        </NavigationItem>
        <Separator invert_margin />
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
