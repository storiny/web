/* eslint-disable @next/next/no-img-element */

import { clsx } from "clsx";
import React from "react";

import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../packages/ui/src/components/typography";

import styles from "./brand-in-use.module.scss";

const BrandInUseSection = (): React.ReactElement => (
  <section className={clsx("flex-col", styles.x, styles.section)}>
    <Typography as={"h2"} level={"display2"}>
      Brand In Use
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <div
      className={clsx("flex-col", "grid", "minimal")}
      style={{ gridTemplateRows: "initial" }}
    >
      <div className={clsx("flex-col", styles.x, styles["section-content"])}>
        <figure className={clsx("flex-center", styles.x, styles.figure)}>
          <img
            alt={""}
            loading={"lazy"}
            src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/brand-in-use/001`}
          />
        </figure>
        <figure className={clsx("flex-center", styles.x, styles.figure)}>
          <img
            alt={""}
            loading={"lazy"}
            src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/brand-in-use/002`}
          />
        </figure>
      </div>
    </div>
  </section>
);

export default BrandInUseSection;
