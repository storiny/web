import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Divider from "~/components/Divider";
import Radio from "~/components/Radio";
import RadioGroup from "~/components/RadioGroup";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { mutatePreferences } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import DashboardGroup from "../../../../dashboard-group";
import commonStyles from "../styles.module.scss";
import styles from "./reading-font-preference.module.scss";

// Font size

const ReadingFontSizePreference = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const dispatch = useAppDispatch();
  const fontSize = useAppSelector((state) => state.preferences.readingFontSize);

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Font size
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={"t-minor"} level={"body2"}>
        Choose a font size with which you are comfortable reading.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <RadioGroup
        className={clsx(commonStyles.x, commonStyles["radio-group"])}
        onValueChange={(newValue): void => {
          dispatch(
            mutatePreferences({
              readingFontSize: newValue as "slim" | "regular" | "oversized"
            })
          );
        }}
        orientation={isSmallerThanMobile ? "vertical" : "horizontal"}
        value={fontSize}
      >
        <div
          className={clsx(
            "flex-col",
            commonStyles.x,
            commonStyles.item,
            fontSize === "slim" && commonStyles.selected
          )}
        >
          <AspectRatio className={"full-w"} ratio={2.3}>
            <div
              className={clsx(
                "full-w",
                "t-legible-slim",
                styles.x,
                styles.preview
              )}
            >
              <Typography level={"legible"}>
                I took a bite of the durian fruit and was immediately hit with a
                pungent aroma that filled my nostrils. Despite the
              </Typography>
            </div>
          </AspectRatio>
          <Divider />
          <Radio
            className={clsx(commonStyles.x, commonStyles.radio)}
            label={"Slim"}
            slotProps={{
              container: {
                className: clsx(commonStyles.x, commonStyles["radio-container"])
              }
            }}
            value={"slim"}
          />
        </div>
        <div
          className={clsx(
            "flex-col",
            commonStyles.x,
            commonStyles.item,
            fontSize === "regular" && commonStyles.selected
          )}
        >
          <AspectRatio className={"full-w"} ratio={2.3}>
            <div className={clsx("full-w", styles.x, styles.preview)}>
              <Typography level={"legible"}>
                I took a bite of the durian fruit and was immediately hit with a
                pungent aroma that filled my nostrils. Despite the
              </Typography>
            </div>
          </AspectRatio>
          <Divider />
          <Radio
            className={clsx(commonStyles.x, commonStyles.radio)}
            label={"Regular (Default)"}
            slotProps={{
              container: {
                className: clsx(commonStyles.x, commonStyles["radio-container"])
              }
            }}
            value={"regular"}
          />
        </div>
        <div
          className={clsx(
            "flex-col",
            commonStyles.x,
            commonStyles.item,
            fontSize === "oversized" && commonStyles.selected
          )}
        >
          <AspectRatio className={"full-w"} ratio={2.3}>
            <div
              className={clsx(
                "full-w",
                "t-legible-oversized",
                styles.x,
                styles.preview
              )}
            >
              <Typography level={"legible"}>
                I took a bite of the durian fruit and was immediately hit with a
                pungent aroma that filled my nostrils. Despite the
              </Typography>
            </div>
          </AspectRatio>
          <Divider />
          <Radio
            className={clsx(commonStyles.x, commonStyles.radio)}
            label={"Oversized"}
            slotProps={{
              container: {
                className: clsx(commonStyles.x, commonStyles["radio-container"])
              }
            }}
            value={"oversized"}
          />
        </div>
      </RadioGroup>
    </React.Fragment>
  );
};

// Typeface

const SatoshiPreview = (): React.ReactElement => (
  <svg fill="none" viewBox="0 0 56 46" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.18 34.64H.68L13.3.27h4.27l12.77 34.37h-3.6l-3.36-9.12H7.54l-3.36 9.12Zm10.8-29.52L8.59 22.5h13.68L15.84 5.12a7.07 7.07 0 0 0-.24-.77c-.1-.25-.16-.46-.2-.62-.02.16-.09.38-.18.67-.07.26-.15.5-.24.72ZM32.62 22.35c0-2.11.44-4.03 1.3-5.76a10.39 10.39 0 0 1 3.74-4.22 10.54 10.54 0 0 1 5.86-1.59c2.2 0 4.1.55 5.66 1.64a8.89 8.89 0 0 1 3.36 4.7l-.52.67.43-6.38h2.88v22.5c0 2.31-.47 4.31-1.4 6a9.64 9.64 0 0 1-3.93 4 11.61 11.61 0 0 1-5.9 1.43c-2.98 0-5.45-.8-7.4-2.4a10.47 10.47 0 0 1-3.65-6.57h3.32a6.83 6.83 0 0 0 2.54 4.37 8.34 8.34 0 0 0 5.23 1.58c2.4 0 4.32-.74 5.76-2.2 1.44-1.48 2.16-3.43 2.16-5.86v-7.3l.48.62a9.13 9.13 0 0 1-3.5 4.66 9.93 9.93 0 0 1-5.76 1.68 10.13 10.13 0 0 1-9.4-5.76 13.42 13.42 0 0 1-1.26-5.8Zm3.32-.05c0 1.6.3 3.06.9 4.37a7.75 7.75 0 0 0 2.7 3.12 7.59 7.59 0 0 0 4.22 1.15c1.66 0 3.09-.36 4.27-1.1a7.58 7.58 0 0 0 2.78-3.07c.64-1.31.96-2.8.96-4.47 0-1.66-.32-3.13-.96-4.41a7.04 7.04 0 0 0-2.68-3.03 7.62 7.62 0 0 0-4.32-1.15 7.45 7.45 0 0 0-6.96 4.32 9.83 9.83 0 0 0-.91 4.27Z"
      fill="var(--fg-major)"
    />
  </svg>
);

const ReadingFontTypefacePreference = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const dispatch = useAppDispatch();
  const typeface = useAppSelector((state) => state.preferences.readingFont);

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Typeface
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography className={"t-minor"} level={"body2"}>
        Choose a typeface that you find comfortable to read.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <RadioGroup
        className={clsx(commonStyles.x, commonStyles["radio-group"])}
        onValueChange={(newValue): void => {
          dispatch(
            mutatePreferences({
              readingFont: newValue
            })
          );
        }}
        orientation={isSmallerThanMobile ? "vertical" : "horizontal"}
        value={typeface}
      >
        <div
          className={clsx(
            "flex-col",
            commonStyles.x,
            commonStyles.item,
            typeface === "satoshi" && commonStyles.selected
          )}
        >
          <AspectRatio className={"full-w"} ratio={2.3}>
            <div
              className={clsx(
                "full-w",
                "t-legible-slim",
                styles.x,
                styles.preview
              )}
            >
              <SatoshiPreview />
            </div>
          </AspectRatio>
          <Divider />
          <Radio
            className={clsx(commonStyles.x, commonStyles.radio)}
            label={"Satoshi (Default)"}
            slotProps={{
              container: {
                className: clsx(commonStyles.x, commonStyles["radio-container"])
              }
            }}
            value={"satoshi"}
          />
        </div>
      </RadioGroup>
    </React.Fragment>
  );
};

const ReadingFontPreference = (): React.ReactElement => (
  <DashboardGroup>
    <Typography as={"h2"} level={"h4"}>
      Reading font preference
    </Typography>
    <Spacer orientation={"vertical"} size={3} />
    <ReadingFontSizePreference />
    <Spacer orientation={"vertical"} size={5} />
    <ReadingFontTypefacePreference />
  </DashboardGroup>
);

export default ReadingFontPreference;
