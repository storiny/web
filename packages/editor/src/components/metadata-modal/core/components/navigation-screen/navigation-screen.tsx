import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import NavigationItem from "~/components/navigation-item";
import Separator from "~/components/separator";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/settings";
import css from "~/theme/main.module.scss";

import { nav_segment_atom } from "../../atoms";
import styles from "./navigation-screen.module.scss";

const NavigationScreen = (): React.ReactElement => {
  const set_nav_segment = use_set_atom(nav_segment_atom);
  return (
    <div className={css["flex-col"]}>
      <div className={clsx(css["flex-col"], styles["item-container"])}>
        <NavigationItem
          decorator={<FileIcon />}
          onClick={(): void => set_nav_segment("general")}
        >
          General
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<SeoIcon />}
          onClick={(): void => set_nav_segment("seo")}
        >
          SEO
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<LicenseIcon />}
          onClick={(): void => set_nav_segment("license")}
        >
          License
        </NavigationItem>
        <Separator invert_margin />
        <NavigationItem
          decorator={<SettingsIcon />}
          onClick={(): void => set_nav_segment("settings")}
        >
          Settings
        </NavigationItem>
      </div>
    </div>
  );
};

export default NavigationScreen;
