import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Divider from "~/components/Divider";
import Radio from "~/components/Radio";
import RadioGroup from "~/components/RadioGroup";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { set_reading_font_size } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import commonStyles from "../../styles.module.scss";
import styles from "./font-size.module.scss";

const TEXT =
  " I took a bite of the durian fruit and was immediately hit with a pungent aroma that filled my nostrils.";

const FontSizeItem = ({
  isActive,
  label,
  value,
  className
}: {
  className: string;
  isActive: boolean;
  label: React.ReactNode;
  value: string;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-col",
      commonStyles.x,
      commonStyles.item,
      isActive && commonStyles.selected
    )}
  >
    <AspectRatio className={"full-w"} ratio={2.3}>
      <div className={clsx("full-w", className, styles.x, styles.preview)}>
        <Typography level={"legible"}>{TEXT}</Typography>
      </div>
    </AspectRatio>
    <Divider />
    <Radio
      className={clsx(commonStyles.x, commonStyles.radio)}
      label={label}
      slot_props={{
        container: {
          className: clsx(commonStyles.x, commonStyles["radio-container"])
        }
      }}
      value={value}
    />
  </div>
);

const ReadingFontSizePreference = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const dispatch = use_app_dispatch();
  const fontSize = use_app_selector(
    (state) => state.preferences.reading_font_size
  );

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
          dispatch(set_reading_font_size(newValue as typeof fontSize));
        }}
        orientation={isSmallerThanMobile ? "vertical" : "horizontal"}
        value={fontSize}
      >
        <FontSizeItem
          className={"t-legible-slim"}
          isActive={fontSize === "slim"}
          label={"Slim"}
          value={"slim"}
        />
        <FontSizeItem
          className={"t-legible-regular"}
          isActive={fontSize === "regular"}
          label={"Regular (Default)"}
          value={"regular"}
        />
        <FontSizeItem
          className={"t-legible-oversized"}
          isActive={fontSize === "oversized"}
          label={"Oversized"}
          value={"oversized"}
        />
      </RadioGroup>
    </React.Fragment>
  );
};

export default ReadingFontSizePreference;
