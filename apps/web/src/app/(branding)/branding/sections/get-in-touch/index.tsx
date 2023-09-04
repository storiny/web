import { clsx } from "clsx";
import React from "react";

import Link from "~/components/Link";
import Typography from "~/components/Typography";

import pageStyles from "../../styles.module.scss";

const GetInTouchSection = (): React.ReactElement => (
  <section className={clsx(pageStyles.x, pageStyles.section)}>
    <Typography
      as={"h2"}
      className={clsx(pageStyles.x, pageStyles["section-title"])}
      level={"display2"}
    >
      Get in touch
    </Typography>
    <div
      className={clsx("flex-col", pageStyles.x, pageStyles["section-content"])}
    >
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
