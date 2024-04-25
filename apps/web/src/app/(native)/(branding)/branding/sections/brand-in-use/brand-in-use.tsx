import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./brand-in-use.module.scss";

const BrandInUseSection = (): React.ReactElement => (
  <section className={clsx(css["flex-col"], styles.section)}>
    <Typography as={"h2"} level={"display2"}>
      Brand In Use
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <div
      className={clsx(css["flex-col"], css["grid"], css["minimal"])}
      style={{ gridTemplateRows: "initial" }}
    >
      <div className={clsx(css["flex-col"], styles["section-content"])}>
        <figure className={clsx(css["flex-center"], styles.figure)}>
          <img
            alt={""}
            loading={"lazy"}
            src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/brand-in-use/001`}
          />
        </figure>
      </div>
    </div>
  </section>
);

export default BrandInUseSection;
