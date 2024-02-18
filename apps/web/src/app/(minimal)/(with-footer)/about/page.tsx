import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import PlusPattern from "~/brand/plus-pattern";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import MailIcon from "~/icons/mail";
import TwitterIcon from "~/icons/twitter";
import css from "~/theme/main.module.scss";

import styles from "./styles.module.scss";

const Page = (): React.ReactElement => (
  <React.Fragment>
    <div className={styles.splash}>
      <PlusPattern style={{ position: "absolute" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={""}
        className={styles["splash-image"]}
        sizes={"100vw"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/presentational/about-splash`}
        srcSet={[
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_640}/web-assets/presentational/about-splash 640w`,
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_960}/web-assets/presentational/about-splash 960w`,
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_1200}/web-assets/presentational/about-splash 1200w`
        ].join(",")}
      />
      <div className={clsx(css["flex-col"], css["t-center"], styles.container)}>
        <Typography level={"display1"}>Your voice matters.</Typography>
        <div className={clsx(css["flex-col"], styles.x, styles.tagline)}>
          <Typography as={"p"} className={css["t-minor"]} level={"h4"}>
            <span className={css["t-major"]}>Storiny</span> is the place for
          </Typography>
          <Typography as={"p"} className={css["t-muted"]} level={"h2"}>
            the <span className={css["t-major"]}>stor</span>y with
            <span className={css["t-major"]}>in y</span>ou.
          </Typography>
        </div>
      </div>
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
      <section className={styles.section}>
        <Typography
          as={"h2"}
          className={clsx(css["fit-h"], styles.x, styles["section-title"])}
          level={"display2"}
        >
          How it started
        </Typography>
        <div className={clsx(css["flex-col"], styles["section-content"])}>
          <Typography level={"legible"}>
            It was in 2021 when we noticed the absence of freely accessible
            public blogging communities in a world where knowledge is the
            ultimate power.
            <br />
            <br />
            The internet is filled with personal blogs, and a majority of them
            are inaccessible, misinformative, unverifiable, or do not feature a
            reaction system. Information that is deemed accurate is often locked
            behind a paywall, or a dozen of advertisements fill up your screen
            the moment you start reading. Finding the right information in the
            massive pool of internet is no easy task.
            <br />
            <br />
            However, this is not the case with Storiny. Here, posts are
            regulated on the basis of collective community reviews and ratings,
            increasing your changes of finding the accurate information that you
            are looking for.
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
          Our vision
        </Typography>
        <div className={clsx(css["flex-col"], styles["section-content"])}>
          <Typography level={"legible"}>
            Your ideas have the power to shape and manipulate the way we think,
            live, and interact with one another. Our vision is to manifest a
            space allowing individuals from various diversities and professions
            to share and express their ideas.
            <br />
            <br />
            Our primary objective is to nurture a culture of creativity,
            empathy, and collaboration, where every idea is deeply valued and
            celebrated.
            <br />
            <br />
            Storiny is crafted to amplify your voice and ideas that have the
            potential to create a substantial impact on society.
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
          Get in touch
        </Typography>
        <div className={clsx(css["flex-col"], styles["section-content"])}>
          <Typography level={"legible"}>
            We are always available to provide any assistance you might need.
            Reach out to us using any of the methods below.
          </Typography>
          <div className={clsx(css["flex-center"], styles.actions)}>
            <Button
              as={"a"}
              decorator={<TwitterIcon />}
              href={"https://twitter.com/storiny_intl/?utm_source=storiny"}
              rel={"noreferrer"}
              size={"lg"}
              target={"_blank"}
              variant={"hollow"}
            >
              @storiny_intl
            </Button>
            <Button
              as={"a"}
              decorator={<MailIcon />}
              href={"mailto:support@storiny.com"}
              size={"lg"}
              variant={"hollow"}
            >
              support@storiny.com
            </Button>
          </div>
        </div>
      </section>
    </article>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export { metadata } from "./metadata";
export default Page;
