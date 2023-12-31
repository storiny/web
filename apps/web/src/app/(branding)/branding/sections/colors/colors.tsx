import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import styles from "./colors.module.scss";

const Stat = ({
  label,
  value
}: {
  label: string;
  value: string;
}): React.ReactElement => (
  <Typography
    className={clsx(
      css["flex-center"],
      css["t-medium"],
      css["t-minor"],
      styles.x,
      styles["stat-label"]
    )}
    level={"body2"}
  >
    {label}
    <Typography
      className={clsx(css["t-medium"], css["t-major"])}
      level={"body2"}
    >
      {value}
    </Typography>
  </Typography>
);

const ColorsSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <Typography
      as={"h2"}
      className={clsx(page_styles.x, page_styles["section-title"])}
      level={"display2"}
    >
      Colors
    </Typography>
    <div className={clsx(css["flex-col"], page_styles["section-content"])}>
      <Typography level={"legible"}>
        The color palette of our brand consists only of two minimalistic and
        bold colors, which conveys a strong and straightforward design language
        that embodies loyalty and power.
      </Typography>
      <div className={clsx(css["flex-center"], styles["swatch-container"])}>
        <div
          className={clsx(
            "force-light-mode",
            css["flex-col"],
            css["t-medium"],
            styles.swatch
          )}
          style={{ backgroundColor: "var(--snow)" }}
        >
          <span className={clsx(css["t-major"], styles["color-name"])}>
            Snow
          </span>
          <Spacer orientation={"vertical"} size={5} />
          <Stat label={"Hex"} value={"#fafafa"} />
          <Stat label={"RGB"} value={"250, 250, 250"} />
          <Stat label={"CMYK"} value={"0, 0, 0, 2"} />
          <Stat label={"PMS"} value={"663 C"} />
        </div>
        <div
          className={clsx(
            "force-dark-mode",
            css["flex-col"],
            css["t-medium"],
            styles.swatch
          )}
          style={{ backgroundColor: "var(--obsidian)" }}
        >
          <span className={clsx(css["t-major"], styles["color-name"])}>
            Obsidian
          </span>
          <Spacer orientation={"vertical"} size={5} />
          <Stat label={"Hex"} value={"#050505"} />
          <Stat label={"RGB"} value={"5, 5, 5"} />
          <Stat label={"CMYK"} value={"0, 0, 0, 98"} />
          <Stat label={"PMS"} value={"7547 C"} />
        </div>
      </div>
    </div>
  </section>
);

export default ColorsSection;
