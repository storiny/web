import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import css from "~/theme/main.module.scss";

import styles from "./membership-card.module.scss";

const MembershipCard = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.card)}>
    <Typography level={"body2"}>
      Create unlimited blogs, customize them to align with your brand, remove
      Storiny branding, enjoy membership benefits, and much more!
    </Typography>
    <Button
      as={NextLink}
      decorator={<PlusBadge no_stroke />}
      href={"/membership"}
      target={"_blank"}
    >
      Get Storiny+
    </Button>
  </div>
);

export default MembershipCard;
