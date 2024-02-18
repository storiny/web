import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import css from "~/theme/main.module.scss";

import MembershipSplash from "./splash";
import styles from "./styles.module.scss";
import MembershipWordmark from "./wordmark";

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
      <Spacer orientation={"vertical"} size={3} />
      <Typography className={styles.tagline}>
        Take full control of your blogs by becoming a{" "}
        <span className={css["t-bold"]}>Storiny+</span> member. Customize your
        blogs to align with your brand, grow your audience through newsletters,
        and utilize the feature-rich publishing tools.
      </Typography>
      <Spacer orientation={"vertical"} size={6.5} />
      <Button decorator={<PlusBadge no_stroke />} size={"lg"}>
        Get Storiny+
      </Button>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={3} />
      <MembershipSplash />
    </div>
    <article className={clsx(css["flex-col"], styles.article)}>
      <section className={styles.section}>
        <Typography
          as={"h2"}
          className={clsx(css["fit-h"], styles.x, styles["section-title"])}
          level={"display2"}
        >
          About Storiny
        </Typography>
        <div className={clsx(css["flex-col"], styles["section-content"])}>
          <Typography level={"legible"}>
            Storiny is where you and your ideas belong, serving a space for
            like-minded individuals to connect, share experiences, and valuable
            knowledge without the hassle of managing stuff that happens behind
            the scenes on the vast internet.
            <br />
            <br />
            Unlike a personal blog, publishing on Storiny is like sharing your
            ideas in a giant, welcoming room filled with diverse readers,
            creating opportunities for learning, growth, and meaningful
            connections.
            <br />
            <br />
            You own your ideas, and they are never restricted behind a paywall.
          </Typography>
        </div>
      </section>
      <Divider />
      <section className={styles.section}>
        <Typography
          as={"h2"}
          className={clsx(css["fit-h"], styles.x, styles["section-title"])}
          level={"display2"}
        >
          Give wings to your ideas
        </Typography>
        <div className={clsx(css["flex-col"], styles["section-content"])}>
          <Typography level={"legible"}>
            Storiny fosters a community where every individual is welcomed to
            share their ideas without any strings attached. We firmly believe
            that knowledge should be accessible to everyone, without any
            barriers or restrictions.
          </Typography>
          <Typography level={"quote"}>
            &quot;Information should be free. It&apos;s an ethical imperative.
            Only information tied to a physical product should have a monetary
            cost attached to it.&quot; — Aaron Swartz
          </Typography>
        </div>
      </section>
      <Divider />
    </article>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export { metadata } from "./metadata";
export default Page;
