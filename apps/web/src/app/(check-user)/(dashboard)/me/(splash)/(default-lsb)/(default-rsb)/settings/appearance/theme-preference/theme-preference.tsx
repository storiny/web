import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Divider from "~/components/divider";
import Radio from "~/components/radio";
import RadioGroup from "~/components/radio-group";
import Spacer from "~/components/spacer";
import TitleBlock from "~/entities/title-block";
import { use_media_query } from "~/hooks/use-media-query";
import { select_theme, set_theme } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardGroup from "../../../../dashboard-group";
import common_styles from "../styles.module.scss";
import styles from "./theme-preference.module.scss";

// Symbol

const ThemePreviewSymbol = (): React.ReactElement => (
  <svg style={{ display: "none" }}>
    <defs>
      <symbol id="theme-preview" viewBox="0 0 200 123">
        <path d="M0 0h200v122.81H0z" fill="var(--bg-body)" />
        <mask fill="#fff" id="theme-a">
          <path d="M132.43 61.43a1.52 1.52 0 1 1 3.05 0 1.52 1.52 0 0 1-3.05 0ZM128.03 61.43a1.52 1.52 0 1 1 3.05 0 1.52 1.52 0 0 1-3.05 0ZM64.35 60.58c0-.38.3-.68.68-.68H91.1c.37 0 .68.3.68.68v1.7c0 .37-.3.67-.68.67H65.03a.68.68 0 0 1-.68-.68v-1.7ZM64.03 73.48c0-.37.3-.67.68-.67h42.5c.38 0 .69.3.69.67v21.46c0 .37-.3.67-.68.67h-42.5a.68.68 0 0 1-.69-.67V73.48ZM115.79 73.48c0-.37.3-.67.68-.67h17.94c.37 0 .68.3.68.67v21.46c0 .37-.3.67-.68.67h-17.94a.68.68 0 0 1-.68-.67V73.48ZM64.35 20.95c0-.19.15-.34.34-.34h70.45c.19 0 .34.15.34.34v33.2c0 .18-.15.33-.34.33H64.69a.34.34 0 0 1-.34-.34V20.95ZM142.6 15.79H200v106.86h-57.4V15.79Z" />
          <path d="M148.35 64.22c0-.37.3-.67.68-.67h44.7c.38 0 .68.3.68.67v12.2c0 .37-.3.67-.68.67h-44.7a.68.68 0 0 1-.68-.67v-12.2ZM148.35 55.42c0-.38.3-.68.68-.68h20.32c.37 0 .68.3.68.68v1.69c0 .37-.3.68-.68.68h-20.32a.68.68 0 0 1-.68-.68v-1.7ZM148.35 21.89c0-.38.3-.68.68-.68h44.7c.38 0 .68.3.68.68V48.3c0 .38-.3.68-.68.68h-44.7a.68.68 0 0 1-.68-.68V21.9ZM0 15.79h57.4v106.86H0V15.79Z" />
          <path d="M20.83 78.79c0-.38.3-.68.68-.68h29.46c.38 0 .68.3.68.68v4.74c0 .37-.3.68-.68.68H21.51a.68.68 0 0 1-.68-.68v-4.74ZM32 48.3c0-.37.31-.67.68-.67h14.9c.38 0 .68.3.68.67v4.75c0 .37-.3.67-.67.67h-14.9a.68.68 0 0 1-.68-.67V48.3ZM32 57.45c0-.37.31-.68.68-.68h14.9c.38 0 .68.3.68.68v4.74c0 .38-.3.68-.67.68h-14.9a.68.68 0 0 1-.68-.68v-4.74ZM32 66.6c0-.38.31-.68.68-.68h14.9c.38 0 .68.3.68.67v4.75c0 .37-.3.67-.67.67h-14.9a.68.68 0 0 1-.68-.67v-4.75ZM5.59 21.55c0-.19.15-.34.34-.34H51.3c.19 0 .34.15.34.34v19.64c0 .19-.15.34-.34.34H5.93a.34.34 0 0 1-.34-.34V21.55Z" />
        </mask>
        <path
          d="M132.43 61.43a1.52 1.52 0 1 1 3.05 0 1.52 1.52 0 0 1-3.05 0ZM128.03 61.43a1.52 1.52 0 1 1 3.05 0 1.52 1.52 0 0 1-3.05 0Z"
          fill="var(--bg-elevation-lg)"
        />
        <path
          d="M64.35 60.58c0-.38.3-.68.68-.68H91.1c.37 0 .68.3.68.68v1.7c0 .37-.3.67-.68.67H65.03a.68.68 0 0 1-.68-.68v-1.7ZM64.03 73.48c0-.37.3-.67.68-.67h42.5c.38 0 .69.3.69.67v21.46c0 .37-.3.67-.68.67h-42.5a.68.68 0 0 1-.69-.67V73.48ZM115.79 73.48c0-.37.3-.67.68-.67h17.94c.37 0 .68.3.68.67v21.46c0 .37-.3.67-.68.67h-17.94a.68.68 0 0 1-.68-.67V73.48ZM64.35 20.95c0-.19.15-.34.34-.34h70.45c.19 0 .34.15.34.34v33.2c0 .18-.15.33-.34.33H64.69a.34.34 0 0 1-.34-.34V20.95Z"
          fill="var(--bg-elevation-md)"
        />
        <path
          d="M142.6 15.79H200v106.86h-57.4V15.79Z"
          fill="var(--bg-elevation-sm)"
        />
        <path
          d="M148.35 64.22c0-.37.3-.67.68-.67h44.7c.38 0 .68.3.68.67v12.2c0 .37-.3.67-.68.67h-44.7a.68.68 0 0 1-.68-.67v-12.2ZM148.35 55.42c0-.38.3-.68.68-.68h20.32c.37 0 .68.3.68.68v1.69c0 .37-.3.68-.68.68h-20.32a.68.68 0 0 1-.68-.68v-1.7ZM148.35 21.89c0-.38.3-.68.68-.68h44.7c.38 0 .68.3.68.68V48.3c0 .38-.3.68-.68.68h-44.7a.68.68 0 0 1-.68-.68V21.9Z"
          fill="var(--divider)"
        />
        <path d="M0 15.79h57.4v106.86H0V15.79Z" fill="var(--bg-elevation-sm)" />
        <path
          d="M20.83 78.79c0-.38.3-.68.68-.68h29.46c.38 0 .68.3.68.68v4.74c0 .37-.3.68-.68.68H21.51a.68.68 0 0 1-.68-.68v-4.74ZM32 48.3c0-.37.31-.67.68-.67h14.9c.38 0 .68.3.68.67v4.75c0 .37-.3.67-.67.67h-14.9a.68.68 0 0 1-.68-.67V48.3ZM32 57.45c0-.37.31-.68.68-.68h14.9c.38 0 .68.3.68.68v4.74c0 .38-.3.68-.67.68h-14.9a.68.68 0 0 1-.68-.68v-4.74ZM32 66.6c0-.38.31-.68.68-.68h14.9c.38 0 .68.3.68.67v4.75c0 .37-.3.67-.67.67h-14.9a.68.68 0 0 1-.68-.67v-4.75ZM5.59 21.55c0-.19.15-.34.34-.34H51.3c.19 0 .34.15.34.34v19.64c0 .19-.15.34-.34.34H5.93a.34.34 0 0 1-.34-.34V21.55Z"
          fill="var(--divider)"
        />
        <path
          d="M132.43 61.43a1.52 1.52 0 1 1 3.05 0 1.52 1.52 0 0 1-3.05 0ZM128.03 61.43a1.52 1.52 0 1 1 3.05 0 1.52 1.52 0 0 1-3.05 0ZM64.35 60.58c0-.38.3-.68.68-.68H91.1c.37 0 .68.3.68.68v1.7c0 .37-.3.67-.68.67H65.03a.68.68 0 0 1-.68-.68v-1.7ZM64.03 73.48c0-.37.3-.67.68-.67h42.5c.38 0 .69.3.69.67v21.46c0 .37-.3.67-.68.67h-42.5a.68.68 0 0 1-.69-.67V73.48ZM115.79 73.48c0-.37.3-.67.68-.67h17.94c.37 0 .68.3.68.67v21.46c0 .37-.3.67-.68.67h-17.94a.68.68 0 0 1-.68-.67V73.48ZM64.35 20.95c0-.19.15-.34.34-.34h70.45c.19 0 .34.15.34.34v33.2c0 .18-.15.33-.34.33H64.69a.34.34 0 0 1-.34-.34V20.95ZM142.6 15.79H200v106.86h-57.4V15.79Z"
          mask="url(#theme-a)"
          stroke="var(--divider)"
          strokeWidth=".34"
        />
        <path
          d="M148.35 64.22c0-.37.3-.67.68-.67h44.7c.38 0 .68.3.68.67v12.2c0 .37-.3.67-.68.67h-44.7a.68.68 0 0 1-.68-.67v-12.2ZM148.35 55.42c0-.38.3-.68.68-.68h20.32c.37 0 .68.3.68.68v1.69c0 .37-.3.68-.68.68h-20.32a.68.68 0 0 1-.68-.68v-1.7ZM148.35 21.89c0-.38.3-.68.68-.68h44.7c.38 0 .68.3.68.68V48.3c0 .38-.3.68-.68.68h-44.7a.68.68 0 0 1-.68-.68V21.9ZM0 15.79h57.4v106.86H0V15.79Z"
          mask="url(#theme-a)"
          stroke="var(--divider)"
          strokeWidth=".34"
        />
        <path
          d="M20.83 78.79c0-.38.3-.68.68-.68h29.46c.38 0 .68.3.68.68v4.74c0 .37-.3.68-.68.68H21.51a.68.68 0 0 1-.68-.68v-4.74ZM32 48.3c0-.37.31-.67.68-.67h14.9c.38 0 .68.3.68.67v4.75c0 .37-.3.67-.67.67h-14.9a.68.68 0 0 1-.68-.67V48.3ZM32 57.45c0-.37.31-.68.68-.68h14.9c.38 0 .68.3.68.68v4.74c0 .38-.3.68-.67.68h-14.9a.68.68 0 0 1-.68-.68v-4.74ZM32 66.6c0-.38.31-.68.68-.68h14.9c.38 0 .68.3.68.67v4.75c0 .37-.3.67-.67.67h-14.9a.68.68 0 0 1-.68-.67v-4.75ZM5.59 21.55c0-.19.15-.34.34-.34H51.3c.19 0 .34.15.34.34v19.64c0 .19-.15.34-.34.34H5.93a.34.34 0 0 1-.34-.34V21.55Z"
          mask="url(#theme-a)"
          stroke="var(--divider)"
          strokeWidth=".34"
        />
        <mask fill="#fff" id="theme-b">
          <path d="M0 0h200v15.79H0V0Z" />
        </mask>
        <path d="M0 0h200v15.79H0V0Z" fill="var(--bg-elevation-md)" />
        <path
          d="M191.36 10.4a2.96 2.96 0 1 1 0-5.93 2.96 2.96 0 0 1 0 5.93ZM24.56 5.35h14.9c.33 0 .6.26.6.6v3.04a.6.6 0 0 1-.6.6h-14.9a.6.6 0 0 1-.6-.6V5.94c0-.33.27-.6.6-.6Zm-18.3 0h14.9c.34 0 .6.26.6.6v3.04a.6.6 0 0 1-.6.6H6.27a.6.6 0 0 1-.59-.6V5.94c0-.33.27-.6.6-.6Z"
          fill="var(--divider)"
          stroke="var(--divider)"
          strokeWidth=".17"
        />
        <path
          d="M200 15.62H0v.34h200v-.34Z"
          fill="var(--divider)"
          mask="url(#theme-b)"
        />
      </symbol>
    </defs>
  </svg>
);

// Theme preview

const ThemePreview = ({
  theme,
  className,
  ...rest
}: {
  theme?: "dark" | "light";
} & React.ComponentPropsWithoutRef<"svg">): React.ReactElement => (
  <svg
    {...rest}
    className={clsx(
      common_styles.preview,
      styles.preview,
      theme
        ? theme === "dark"
          ? "force-dark-mode"
          : "force-light-mode"
        : null,
      className
    )}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <use href={"#theme-preview"} />
  </svg>
);

// Item

const ThemeItem = ({
  preview,
  is_active,
  ratio,
  label,
  value
}: {
  is_active: boolean;
  label: React.ReactNode;
  preview: React.ReactNode;
  ratio: number;
  value: string;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-col",
      common_styles.item,
      is_active && common_styles.selected
    )}
  >
    <AspectRatio className={"full-w"} ratio={ratio}>
      {preview}
    </AspectRatio>
    <Divider />
    <Radio
      className={clsx(common_styles.x, common_styles.radio)}
      label={label}
      slot_props={{
        container: {
          className: clsx(common_styles.x, common_styles["radio-container"])
        }
      }}
      value={value}
    />
  </div>
);

const ThemePreference = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const dispatch = use_app_dispatch();
  const theme = use_app_selector(select_theme);
  const ratio = is_smaller_than_mobile ? 2.21 : 1.62;

  return (
    <DashboardGroup>
      <TitleBlock title={"Theme preference"}>
        Choose between a dark and a light theme, or opt to sync with your system
        and allow for automatic selection of dark or light themes.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4} />
      <RadioGroup
        className={clsx(common_styles.x, common_styles["radio-group"])}
        onValueChange={(next_value): void => {
          dispatch(set_theme(next_value as "light" | "dark" | "system"));
        }}
        orientation={is_smaller_than_mobile ? "vertical" : "horizontal"}
        value={theme}
      >
        <ThemeItem
          is_active={theme === "system"}
          label={"Sync with system"}
          preview={
            <React.Fragment>
              <ThemePreview className={styles["clip-left"]} theme={"light"} />
              <ThemePreview className={styles["clip-right"]} theme={"dark"} />
            </React.Fragment>
          }
          ratio={ratio}
          value={"system"}
        />
        <ThemeItem
          is_active={theme === "light"}
          label={"Light theme"}
          preview={<ThemePreview theme={"light"} />}
          ratio={ratio}
          value={"light"}
        />
        <ThemeItem
          is_active={theme === "dark"}
          label={"Dark theme"}
          preview={<ThemePreview theme={"dark"} />}
          ratio={ratio}
          value={"dark"}
        />
      </RadioGroup>
      <ThemePreviewSymbol />
    </DashboardGroup>
  );
};

export default ThemePreference;
