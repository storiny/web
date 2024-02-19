import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import css from "~/theme/main.module.scss";

import { VisuallyHidden } from "../../../(branding)/branding/visually-hidden";
import BasicFeatures from "./sections/basic-features";
import CollaborationSection from "./sections/collaboration";
import CustomBrandingSection from "./sections/custom-branding";
import CustomDomainSection from "./sections/custom-domain";
import CustomizationSection from "./sections/customization";
import LeftSidebarItemsSection from "./sections/left-sidebar-items";
import MembershipBadgeSection from "./sections/membership-badge";
import PlusFeatures from "./sections/plus-features";
import RightSidebarItemsSection from "./sections/right-sidebar-items";
import MembershipSplash from "./splash";
import styles from "./styles.module.scss";
import MembershipWordmark from "./wordmark";

const SectionDivider = (): React.ReactElement => (
  <Typography
    as={"div"}
    className={clsx(styles.x, styles.divider)}
    color={"muted"}
    role={"separator"}
  >
    ***
  </Typography>
);

const Page = (): React.ReactElement => (
  <React.Fragment>
    <div
      className={clsx(
        css["flex-col"],
        css["flex-center"],
        css["t-center"],
        styles.hero
      )}
    >
      <MembershipWordmark />
      <VisuallyHidden asChild>
        <h1>Storiny+</h1>
      </VisuallyHidden>
      <Spacer orientation={"vertical"} size={3} />
      <Typography className={styles.tagline}>
        Take full control of your blogs by becoming a{" "}
        <span className={css["t-bold"]}>Storiny+</span> member. Customize your
        blogs to align with your brand, grow your audience through newsletters,
        and utilize the feature-rich publishing tools.
      </Typography>
      <Spacer orientation={"vertical"} size={6.5} />
      <Button
        decorator={<PlusBadge no_stroke />}
        size={"lg"}
        style={{ pointerEvents: "none" }}
      >
        Available soon
      </Button>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={3} />
      <MembershipSplash />
    </div>
    <article className={clsx(css["flex-col"], styles.article)}>
      <PlusFeatures />
      <Spacer orientation={"vertical"} size={3} />
      <CustomBrandingSection />
      <Spacer orientation={"vertical"} size={3} />
      <RightSidebarItemsSection />
      <Spacer orientation={"vertical"} size={3} />
      <CollaborationSection />
      <Spacer orientation={"vertical"} size={3} />
      <CustomizationSection />
      <Spacer orientation={"vertical"} size={3} />
      <MembershipBadgeSection />
      <Spacer orientation={"vertical"} size={3} />
      <SectionDivider />
      <Spacer orientation={"vertical"} size={3} />
      <div
        className={clsx(css["flex-col"], css["flex-center"], css["t-center"])}
      >
        <Typography as={"h2"} level={"h1"}>
          Not sure yet?
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <Typography level={"legible"}>
          You can still continue using the basic plan with limited features, and
          upgrade whenever you wish.
        </Typography>
      </div>
      <BasicFeatures />
      <Spacer orientation={"vertical"} size={3} />
      <CustomDomainSection />
      <Spacer orientation={"vertical"} size={3} />
      <LeftSidebarItemsSection />
      <Spacer orientation={"vertical"} size={3} />
      <SectionDivider />
      <Spacer orientation={"vertical"} size={3} />
      <div
        className={clsx(css["flex-col"], css["flex-center"], css["t-center"])}
      >
        <Typography as={"h2"} level={"h1"}>
          Something else?
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <Typography level={"legible"}>
          Reach out to us at{" "}
          <Link href={"mailto:support@storiny.com"} underline={"always"}>
            support@storiny.com
          </Link>{" "}
          and we’ll try our best to resolve your issue.
        </Typography>
      </div>
    </article>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export { metadata } from "./metadata";
export default Page;
