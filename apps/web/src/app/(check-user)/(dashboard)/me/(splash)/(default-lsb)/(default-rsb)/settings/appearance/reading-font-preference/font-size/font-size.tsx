import { clsx } from "clsx";
import React from "react";

import AspectRatio from "../../../../../../../../../../../../../../packages/ui/src/components/aspect-ratio";
import Divider from "../../../../../../../../../../../../../../packages/ui/src/components/divider";
import Radio from "../../../../../../../../../../../../../../packages/ui/src/components/radio";
import RadioGroup from "../../../../../../../../../../../../../../packages/ui/src/components/radio-group";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_media_query } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import { set_reading_font_size } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import common_styles from "../../styles.module.scss";
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
      common_styles.x,
      common_styles.item,
      isActive && common_styles.selected
    )}
  >
    <AspectRatio className={"full-w"} ratio={2.3}>
      <div className={clsx("full-w", className, styles.x, styles.preview)}>
        <Typography level={"legible"}>{TEXT}</Typography>
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

const ReadingFontSizePreference = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
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
        className={clsx(common_styles.x, common_styles["radio-group"])}
        onValueChange={(newValue): void => {
          dispatch(set_reading_font_size(newValue as typeof fontSize));
        }}
        orientation={is_smaller_than_mobile ? "vertical" : "horizontal"}
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
