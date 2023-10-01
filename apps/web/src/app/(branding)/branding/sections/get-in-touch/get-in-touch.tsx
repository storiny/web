import { clsx } from "clsx";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";

import page_styles from "../../styles.module.scss";

const GetInTouchSection = (): React.ReactElement => (
  <section className={clsx(page_styles.section)}>
    <Typography
      as={"h2"}
      className={clsx(page_styles.x, page_styles["section-title"])}
      level={"display2"}
    >
      Get in touch
    </Typography>
    <div className={clsx("flex-col", page_styles["section-content"])}>
      <Typography level={"legible"}>
        For any inquiries related to the contents of these branding guidelines
        or if there is uncertainty in ensuring that your communication aligns
        with the Storiny brand, please feel free to contact us at{" "}
        <Link href={"mailto:brand@storiny.com"} underline={"always"}>
          brand@storiny.com
        </Link>
        .
      </Typography>
    </div>
  </section>
);

export default GetInTouchSection;
