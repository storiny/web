import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import pageStyles from "../../styles.module.scss";
import styles from "./colors.module.scss";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Typography
    className={clsx("flex-center", "t-medium", "t-minor", styles["stat-label"])}
    level={"body2"}
  >
    {label}
    <Typography className={clsx("t-medium", "t-major")} level={"body2"}>
      {value}
    </Typography>
  </Typography>
);

const ColorsSection = () => (
  <section className={clsx(pageStyles.section)}>
    <Typography
      as={"h2"}
      className={pageStyles["section-title"]}
      level={"display2"}
    >
      Colors
    </Typography>
    <div className={clsx("flex-col", pageStyles["section-content"])}>
      <Typography level={"legible"}>
        The color palette of our brand consists of only two minimalistic colors,
        which conveys a strong and straightforward design language that embodies
        loyalty and power.
      </Typography>
      <div className={clsx("flex-center", styles["swatch-container"])}>
        <div
          className={clsx(
            "force-light-mode",
            "flex-col",
            "t-medium",
            styles.swatch
          )}
          style={{ backgroundColor: "var(--snow)" }}
        >
          <span className={clsx("t-major", styles["color-name"])}>Snow</span>
          <Spacer orientation={"vertical"} size={5} />
          <Stat label={"Hex"} value={"#fafafa"} />
          <Stat label={"RGB"} value={"250, 250, 250"} />
          <Stat label={"CMYK"} value={"0, 0, 0, 2"} />
          <Stat label={"PMS"} value={"663 C"} />
        </div>
        <div
          className={clsx(
            "force-dark-mode",
            "flex-col",
            "t-medium",
            styles.swatch
          )}
          style={{ backgroundColor: "var(--obsidian)" }}
        >
          <span className={clsx("t-major", styles["color-name"])}>
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
