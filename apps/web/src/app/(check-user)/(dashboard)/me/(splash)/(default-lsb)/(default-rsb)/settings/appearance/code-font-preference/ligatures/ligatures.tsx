import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Divider from "~/components/divider";
import Radio from "~/components/radio";
import RadioGroup from "~/components/radio-group";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import { toggle_code_ligatures } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import common_styles from "../../styles.module.scss";
import styles from "./ligatures.module.scss";

const DisabledPreview = (): React.ReactElement => (
  <svg
    className={clsx(styles.x, styles.svg)}
    fill="none"
    viewBox="0 0 127 42"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M.2 8.01V6.7h7.22V8H.21ZM11.52 2.3l6.92 4.27v1.55l-6.83 4.28-.82-1.12 6.36-3.92-6.36-3.92.73-1.14ZM50.49 5.03v1.3h-7v-1.3h7Zm0 3.41v1.32h-7V8.44h7ZM61.28 5.03v1.3h-7v-1.3h7Zm0 3.41v1.32h-7V8.44h7ZM72.07 5.03v1.3h-7v-1.3h7Zm0 3.41v1.32h-7V8.44h7ZM100.58.42c.53 0 1.05.08 1.53.26.49.17.98.53 1.47 1.07l-.9.83c-.31-.35-.63-.6-.96-.78a2.5 2.5 0 0 0-1.16-.25c-.63 0-1.1.17-1.43.51-.31.34-.47.77-.47 1.3 0 .37.1.72.3 1.03a2.26 2.26 0 0 0 1.91 1.05h5v1.19h-1.6v4.9a4.58 4.58 0 0 1-1.96 1.4 5.2 5.2 0 0 1-1.78.27c-.94 0-1.7-.18-2.3-.54a3.4 3.4 0 0 1-1.3-1.39 4.04 4.04 0 0 1-.41-1.78c0-.93.24-1.7.72-2.29.5-.6 1.2-.98 2.1-1.17v-.05a3.1 3.1 0 0 1-1.3-.59 2.38 2.38 0 0 1-.67-.92 3.1 3.1 0 0 1-.2-1.1c0-.53.14-1.02.42-1.46.27-.45.67-.8 1.18-1.08a3.75 3.75 0 0 1 1.8-.41Zm2.3 6.2h-2.22a2.46 2.46 0 0 0-2.39 1.53C98.1 8.57 98 9 98 9.43a3 3 0 0 0 .26 1.24c.18.39.46.7.83.94.38.24.87.36 1.48.36.5 0 .95-.08 1.35-.24.4-.17.72-.4.97-.71v-4.4ZM111.37.42c.54 0 1.05.08 1.54.26.48.17.97.53 1.46 1.07l-.9.83c-.31-.35-.63-.6-.96-.78a2.5 2.5 0 0 0-1.16-.25c-.63 0-1.1.17-1.42.51-.32.34-.48.77-.48 1.3 0 .37.1.72.3 1.03a2.26 2.26 0 0 0 1.92 1.05h5v1.19h-1.61v4.9a4.58 4.58 0 0 1-1.95 1.4 5.2 5.2 0 0 1-1.79.27c-.93 0-1.7-.18-2.3-.54a3.4 3.4 0 0 1-1.3-1.39 4.04 4.04 0 0 1-.41-1.78c0-.93.24-1.7.73-2.29.49-.6 1.19-.98 2.1-1.17v-.05a3.1 3.1 0 0 1-1.3-.59 2.38 2.38 0 0 1-.68-.92 3.1 3.1 0 0 1-.2-1.1c0-.53.14-1.02.42-1.46.28-.45.67-.8 1.18-1.08a3.75 3.75 0 0 1 1.8-.41Zm2.31 6.2h-2.23a2.46 2.46 0 0 0-2.39 1.53c-.18.42-.27.85-.27 1.28a3 3 0 0 0 .27 1.24c.17.39.45.7.82.94.38.24.87.36 1.48.36.5 0 .95-.08 1.35-.24.4-.17.73-.4.97-.71v-4.4ZM.73 30.3l6.92 4.27v1.55L.82 40.4 0 39.28l6.35-3.92L0 31.44l.73-1.14ZM18.11 33.03v1.3h-7v-1.3h7Zm0 3.41v1.32h-7v-1.31h7ZM50.1 30.3l.72 1.16-6.35 3.9 6.35 3.93-.8 1.1-6.85-4.27v-1.55l6.92-4.27ZM61.28 33.03v1.3h-7v-1.3h7Zm0 3.41v1.32h-7v-1.31h7ZM93.26 30.3l.73 1.16-6.35 3.9 6.35 3.93-.8 1.1-6.85-4.27v-1.55l6.92-4.27ZM101.75 28.6l-.15 8.3h-1.36l-.18-8.3h1.7Zm-.81 10.18c.34 0 .63.12.86.36.23.23.35.51.35.84a1.2 1.2 0 0 1-1.22 1.22c-.34 0-.62-.12-.85-.35a1.2 1.2 0 0 1-.34-.87c0-.33.11-.61.34-.84.23-.24.51-.36.86-.36ZM108.14 36.01V34.7h7.22V36h-7.22ZM118.93 36.01V34.7h7.22V36h-7.22Z"
      fill="var(--ligature-preview-fill)"
    />
  </svg>
);

const EnabledPreview = (): React.ReactElement => (
  <svg
    className={clsx(styles.x, styles.svg)}
    fill="none"
    viewBox="0 0 126 43"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M.15 8.27V6.93h8.74v1.34H.15Z"
      fill="var(--ligature-preview-fill)"
    />
    <path
      d="M15.9 8.27H8.52V6.93h7.38v1.34Zm-3.5-6.15 4.9 5.48-4.9 5.48-1.12-.95 2.57-2.83c.24-.26.44-.47.6-.61.14-.14.33-.29.55-.42V6.93c-.22-.13-.4-.27-.56-.42l-.6-.61-2.56-2.83 1.12-.95ZM71.57 3.55v1.3h-28.6v-1.3h28.6Zm0 6.83v1.31h-28.6v-1.3h28.6Zm0-3.41v1.3h-28.6v-1.3h28.6ZM100.96.66c.54 0 1.05.09 1.54.26.48.18.97.53 1.46 1.07l-.9.83c-.31-.35-.63-.6-.95-.77a2.55 2.55 0 0 0-1.17-.25c-.63 0-1.1.17-1.42.5-.32.34-.48.78-.48 1.31 0 .37.1.71.3 1.03a2.26 2.26 0 0 0 1.91 1.04h7.67v1.2h-4.27v4.89a4.37 4.37 0 0 1-1.95 1.4 5.2 5.2 0 0 1-1.79.27c-.93 0-1.7-.18-2.28-.54a3.32 3.32 0 0 1-1.3-1.38 3.97 3.97 0 0 1-.43-1.79c0-.93.25-1.69.74-2.28a3.5 3.5 0 0 1 2.09-1.17v-.06a3.02 3.02 0 0 1-1.3-.58 2.27 2.27 0 0 1-.67-.93c-.13-.35-.2-.72-.2-1.09 0-.53.13-1.02.41-1.46.28-.45.67-.81 1.18-1.08a3.75 3.75 0 0 1 1.8-.42Zm2.31 6.21h-2.23a2.46 2.46 0 0 0-2.38 1.52 3.2 3.2 0 0 0-.28 1.29c0 .43.1.84.27 1.23.18.4.45.7.83.95.37.24.86.36 1.47.36.5 0 .96-.08 1.36-.25.4-.16.72-.4.96-.7v-4.4Zm6.69-6.2c.54 0 1.05.08 1.54.25.48.18.97.53 1.46 1.07l-.9.83c-.31-.35-.63-.6-.96-.77a2.5 2.5 0 0 0-1.16-.25c-.63 0-1.1.17-1.42.5-.32.34-.48.78-.48 1.31 0 .37.1.71.3 1.03a2.26 2.26 0 0 0 1.91 1.04h5v1.2h-1.6v4.89a4.58 4.58 0 0 1-1.96 1.4 5.2 5.2 0 0 1-1.78.27c-.93 0-1.7-.18-2.3-.54a3.4 3.4 0 0 1-1.3-1.38 4.04 4.04 0 0 1-.41-1.79c0-.93.24-1.69.73-2.28.49-.6 1.19-.99 2.1-1.17v-.06a3.1 3.1 0 0 1-1.3-.58 2.38 2.38 0 0 1-.68-.93 3.1 3.1 0 0 1-.2-1.09c0-.53.14-1.02.42-1.46.28-.45.67-.81 1.18-1.08a3.75 3.75 0 0 1 1.8-.42Zm2.31 6.2h-2.23a2.46 2.46 0 0 0-2.39 1.52c-.18.43-.27.86-.27 1.29a3 3 0 0 0 .27 1.23c.17.4.45.7.82.95.38.24.87.36 1.48.36.5 0 .95-.08 1.35-.25.4-.16.73-.4.97-.7v-4.4ZM3.5 37.55l9.88-4.33.53 1.17-9.86 4.39-.54-1.23Zm.34 4.18 9.87-4.33.53 1.17-9.87 4.38-.53-1.22Zm-.33-11.95.54-1.23 9.86 4.4v1.44l-.53-.27-9.87-4.34ZM57.06 37.55l-9.87-4.33-.53 1.17 9.86 4.39.54-1.23Zm-.33 4.18-9.87-4.33-.53 1.17 9.87 4.38.53-1.22Zm.33-11.95-.54-1.23-9.86 4.4v1.44l.53-.27 9.87-4.34ZM89.53 30.12l1.12.95-2.57 2.83-.4.44a4.85 4.85 0 0 1-.75.6h5.43v1.33h-5.44c.22.14.43.3.62.48s.37.36.54.55l2.57 2.83-1.12.95-4.9-5.48 4.9-5.48Zm8.32 6.15v-1.34h27.34v1.34H97.85Zm-2.02-7.43-.15 8.3h-1.36l-.18-8.3h1.69Zm-.82 10.19a1.19 1.19 0 0 1 1.22 1.2c0 .33-.12.62-.35.86-.23.23-.52.35-.87.35-.34 0-.63-.12-.85-.35a1.21 1.21 0 0 1-.35-.86c0-.33.12-.62.35-.85.22-.23.5-.35.85-.35Z"
      fill="var(--ligature-preview-fill)"
    />
  </svg>
);

const TypefaceItem = ({
  is_active,
  label,
  value,
  decorator
}: {
  decorator: React.ReactNode;
  is_active: boolean;
  label: React.ReactNode;
  value: string;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-col",
      common_styles.item,
      is_active && common_styles.selected,
      styles.item,
      is_active && styles.selected
    )}
  >
    <AspectRatio className={"full-w"} ratio={2.3}>
      <div
        className={clsx("flex-center", "full-w", styles.x, styles.decorator)}
      >
        {decorator}
      </div>
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

const LigaturesPreference = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const dispatch = use_app_dispatch();
  const typeface = use_app_selector((state) => state.preferences.code_font);
  const ligatures = use_app_selector(
    (state) => state.preferences.enable_code_ligatures
  );

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Ligatures
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={"t-minor"} level={"body2"}>
        Choose whether to enable ligatures for reading code blocks and code
        snippets. Ligatures join two or more graphemes (letters) to improve code
        appearance, but note that they are not available with the system font
        and may cause readability issues.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <RadioGroup
        className={clsx(common_styles.x, common_styles["radio-group"])}
        disabled={typeface === "system"}
        onValueChange={(next_value): void => {
          dispatch(toggle_code_ligatures(next_value !== "disabled"));
        }}
        orientation={is_smaller_than_mobile ? "vertical" : "horizontal"}
        value={ligatures ? "enabled" : "disabled"}
      >
        <TypefaceItem
          decorator={<DisabledPreview />}
          is_active={!ligatures}
          label={"Disabled (Default)"}
          value={"disabled"}
        />
        <TypefaceItem
          decorator={<EnabledPreview />}
          is_active={ligatures}
          label={"Enabled"}
          value={"enabled"}
        />
      </RadioGroup>
    </React.Fragment>
  );
};

export default LigaturesPreference;
