import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Divider from "~/components/divider";
import Radio from "~/components/radio";
import RadioGroup from "~/components/radio-group";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import { set_code_font } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import common_styles from "../../styles.module.scss";
import typeface_styles from "../../typeface.module.scss";

const PlexMonoPreview = (): React.ReactElement => (
  <svg
    className={typeface_styles.svg}
    fill="none"
    viewBox="0 0 55 45"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21.99 34.47h4.27L16 .97h-5.33L.4 34.47h4.18l2.83-9.55h11.76l2.83 9.55Zm-8.5-29.23 4.7 16.17H8.37l4.7-16.17h.43ZM54.61 37.3c0-2.01-.72-3.6-2.16-4.8-1.44-1.2-3.8-1.82-6.96-1.82h-5.47c-1.2 0-2.16-.1-2.88-.34-.77-.24-1.1-.72-1.1-1.48 0-.39.1-.77.33-1.1a4.31 4.31 0 0 1 2.02-1.4c.38-.14.81-.24 1.2-.34.38.1.76.15 1.15.15.38.04.77.04 1.2.04 1.44 0 2.73-.19 3.93-.62 1.2-.38 2.21-.96 3.08-1.73a8.54 8.54 0 0 0 2.64-6.19c0-1.3-.24-2.5-.72-3.55a8.25 8.25 0 0 0-2.07-2.74V9.7h5.57V6.34h-4.56c-1.1 0-1.87.34-2.3.96a3.93 3.93 0 0 0-.68 2.4v.44c-1.44-.68-3.07-1.01-4.9-1.01-1.43 0-2.78.24-3.93.62-1.2.43-2.2 1-3.07 1.78a7.1 7.1 0 0 0-1.92 2.69 8.23 8.23 0 0 0-.67 3.45c0 1.78.38 3.31 1.25 4.6a7.86 7.86 0 0 0 3.6 2.98v.2c-1.3.33-2.36.81-3.22 1.44-.86.67-1.25 1.63-1.25 2.88 0 .86.2 1.53.58 2.06.38.58.91 1 1.63 1.34v.58c-1.3.38-2.3.91-2.98 1.63a4.32 4.32 0 0 0-1.05 3.12c0 2.02.86 3.5 2.6 4.56 1.72 1.06 4.6 1.59 8.63 1.59 4.13 0 7.25-.58 9.36-1.78a6.03 6.03 0 0 0 3.12-5.57Zm-3.6.2c0 1.34-.62 2.4-1.87 3.07-1.25.67-3.03 1-5.23 1h-3.75c-2.01 0-3.45-.38-4.32-1.15a3.67 3.67 0 0 1-1.3-2.83c0-1.54.82-2.69 2.5-3.36h8.6c1.96 0 3.35.34 4.17.91.77.58 1.2 1.4 1.2 2.35Zm-9.07-14.26c-1.92 0-3.36-.43-4.23-1.34a4.67 4.67 0 0 1-1.34-3.56v-1.39c0-1.44.43-2.64 1.34-3.5.87-.87 2.3-1.35 4.23-1.35 1.92 0 3.31.48 4.22 1.35.91.86 1.4 2.06 1.4 3.5v1.4a4.7 4.7 0 0 1-1.4 3.54c-.9.92-2.3 1.35-4.22 1.35Z"
      fill="var(--typeface-preview-fill)"
    />
  </svg>
);

const SourceCodeProPreview = (): React.ReactElement => (
  <svg
    className={typeface_styles.svg}
    fill="none"
    viewBox="0 0 56 43"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M.8 32.17 11.4.7h4.51l10.61 31.48H22.3l-5.47-17.61-1.64-5.23c-.5-1.76-1-3.55-1.48-5.38h-.2c-.5 1.83-1.02 3.62-1.53 5.38a466.5 466.5 0 0 1-1.59 5.23L4.87 32.17H.8Zm5.56-9.6v-3.21h14.45v3.21H6.36ZM42.25 42.93c-2.28 0-4.21-.26-5.81-.77a8.21 8.21 0 0 1-3.7-2.2 5.17 5.17 0 0 1-1.25-3.51c0-.93.32-1.86.96-2.79.68-.9 1.64-1.7 2.88-2.4v-.19a6.4 6.4 0 0 1-1.68-1.44c-.48-.6-.72-1.4-.72-2.4 0-.73.24-1.49.72-2.25a6.8 6.8 0 0 1 2.07-2.12v-.19a7.85 7.85 0 0 1-2.07-2.45 7.57 7.57 0 0 1-.81-3.6c0-1.7.41-3.17 1.25-4.41a8.62 8.62 0 0 1 3.36-2.88c1.4-.7 2.92-1.06 4.56-1.06 1.3 0 2.46.2 3.45.58h9.65v3.21h-6.05c.55.55 1.01 1.23 1.4 2.07.38.83.57 1.7.57 2.64 0 1.66-.4 3.1-1.2 4.32a7.83 7.83 0 0 1-3.26 2.73 11.04 11.04 0 0 1-6.53.77c-.67-.16-1.33-.38-1.97-.67a4.5 4.5 0 0 0-1.34 1.2 2.5 2.5 0 0 0-.48 1.49c0 .9.41 1.57 1.24 2.01.87.45 2.07.68 3.6.68h5.24c3 0 5.23.41 6.67 1.24 1.47.84 2.2 2.24 2.2 4.23 0 1.44-.52 2.78-1.58 4.03a10.7 10.7 0 0 1-4.5 2.98c-1.93.76-4.22 1.15-6.87 1.15ZM42 22.14c.99 0 1.88-.22 2.68-.67a4.94 4.94 0 0 0 1.97-1.92c.48-.83.72-1.8.72-2.93a5.4 5.4 0 0 0-.72-2.83 4.94 4.94 0 0 0-1.97-1.92 5.29 5.29 0 0 0-5.38 0 5.38 5.38 0 0 0-1.96 1.92 5.4 5.4 0 0 0-.72 2.83c0 1.12.24 2.1.72 2.93a5.38 5.38 0 0 0 1.97 1.92c.83.45 1.73.67 2.69.67Zm.52 17.9c1.83 0 3.4-.22 4.7-.66a7.76 7.76 0 0 0 3.03-1.73c.7-.7 1.06-1.46 1.06-2.26 0-1.12-.45-1.87-1.35-2.26-.86-.38-2.19-.57-3.98-.57h-4.56c-.67 0-1.31-.03-1.92-.1-.58-.06-1.12-.16-1.63-.29a6.84 6.84 0 0 0-2.3 1.88 3.61 3.61 0 0 0-.68 2.01c0 1.22.64 2.18 1.92 2.88 1.31.74 3.22 1.1 5.71 1.1Z"
      fill="var(--typeface-preview-fill)"
    />
  </svg>
);

const SystemPreview = (): React.ReactElement => (
  <svg
    className={typeface_styles.svg}
    fill="none"
    viewBox="0 0 52 42"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M26.6 31.2h-4.54l-2.13-6.68H7.18L5.02 31.2H.7L10.86.57h5.72L26.6 31.2Zm-7.87-10.4L13.55 4.4 8.37 20.8h10.36ZM47.54 11a7.09 7.09 0 0 1 1.38 4.27c0 1.21-.22 2.33-.68 3.35a7.31 7.31 0 0 1-1.87 2.57 8.84 8.84 0 0 1-2.93 1.7c-1.13.38-2.37.58-3.73.58a12 12 0 0 1-2.76-.3 7.29 7.29 0 0 1-2.04-.8c-.3.43-.55.85-.75 1.24-.2.39-.3.83-.3 1.31 0 .6.27 1.09.84 1.48.57.39 1.33.6 2.27.63l6.19.23c1.17.04 2.25.18 3.23.45 1 .27 1.85.65 2.56 1.15a5.23 5.23 0 0 1 2.27 4.4 6.67 6.67 0 0 1-2.79 5.44c-.94.72-2.13 1.3-3.59 1.71a18.7 18.7 0 0 1-5.18.64c-1.9 0-3.53-.16-4.87-.47-1.33-.3-2.42-.72-3.28-1.27a5 5 0 0 1-1.88-1.92 5.1 5.1 0 0 1-.58-2.44c0-1.14.26-2.14.8-3a9 9 0 0 1 2.45-2.48 3.88 3.88 0 0 1-2.2-2.7 5.65 5.65 0 0 1 .56-3.9c.49-.83 1.06-1.63 1.71-2.38A8.2 8.2 0 0 1 31 18.33c-.15-.4-.28-.83-.37-1.28-.08-.47-.12-1-.12-1.6a7.66 7.66 0 0 1 5.44-7.6c1.14-.4 2.4-.6 3.77-.6a11.43 11.43 0 0 1 3.07.42h8.53V11h-3.77ZM33.38 34.6c0 1.1.58 1.91 1.74 2.41 1.15.52 2.76.78 4.83.78 1.3 0 2.38-.12 3.25-.35a6.3 6.3 0 0 0 2.14-.94 3.31 3.31 0 0 0 1.52-2.81c0-.96-.4-1.66-1.17-2.11a8.17 8.17 0 0 0-3.59-.8l-6.14-.21c-.51.34-.94.68-1.29 1a4.1 4.1 0 0 0-1.29 3.02Zm1.24-19.24c0 .75.13 1.44.38 2.06.25.63.6 1.16 1.05 1.6a5 5 0 0 0 3.66 1.38c.81 0 1.53-.14 2.16-.4a4.64 4.64 0 0 0 2.58-2.74 5.5 5.5 0 0 0-.02-3.96 4.51 4.51 0 0 0-2.68-2.6 5.33 5.33 0 0 0-2.04-.38 4.9 4.9 0 0 0-4.76 3.14c-.22.6-.33 1.24-.33 1.9Z"
      fill="var(--typeface-preview-fill)"
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
      css["flex-col"],
      common_styles.item,
      is_active && common_styles.selected,
      typeface_styles.item,
      is_active && typeface_styles.selected
    )}
  >
    <AspectRatio className={css["full-w"]} ratio={2.3}>
      <div
        className={clsx(
          css["flex-center"],
          css["full-w"],
          typeface_styles.decorator
        )}
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

const CodeFontTypefacePreference = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const dispatch = use_app_dispatch();
  const typeface = use_app_selector((state) => state.preferences.code_font);

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Typeface
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Choose a monospaced typeface that you find comfortable for reading code
        blocks and code snippets.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <RadioGroup
        className={clsx(
          common_styles.x,
          common_styles["radio-group"],
          common_styles.wrap,
          typeface_styles.x,
          typeface_styles["radio-group"]
        )}
        onValueChange={(next_value): void => {
          dispatch(set_code_font(next_value as typeof typeface));
        }}
        orientation={is_smaller_than_mobile ? "vertical" : "horizontal"}
        value={typeface}
      >
        <TypefaceItem
          decorator={<SystemPreview />}
          is_active={typeface === "system"}
          label={"System"}
          value={"system"}
        />
        <TypefaceItem
          decorator={<PlexMonoPreview />}
          is_active={typeface === "plex-mono"}
          label={"IBM Plex Mono"}
          value={"plex-mono"}
        />
        <TypefaceItem
          decorator={<SourceCodeProPreview />}
          is_active={typeface === "source-code-pro"}
          label={"Source Code Pro"}
          value={"source-code-pro"}
        />
      </RadioGroup>
    </React.Fragment>
  );
};

export default CodeFontTypefacePreference;
