import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import Image from "next/image";
import React from "react";

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
      <Image
        alt={""}
        data-invert-filter={""}
        fill
        loading={"eager"}
        priority
        src={"web-assets/background/noise"}
        style={{ objectFit: "cover" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={""}
        className={styles["splash-image"]}
        sizes={"100vw"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/presentational/about-splash`}
        srcSet={[
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_640}/web-assets/presentational/about-splash 640w`,
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_860}/web-assets/presentational/about-splash 860w`,
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_1024}/web-assets/presentational/about-splash 1024w`,
          `${process.env.NEXT_PUBLIC_CDN_URL}/w@${ImageSize.W_1440}/web-assets/presentational/about-splash 1440w`
        ].join(",")}
      />
      <div className={clsx(css["flex-col"], css["t-center"], styles.container)}>
        <Typography level={"display1"}>Your voice matters.</Typography>
        <div className={css["flex-col"]}>
          <Typography as={"p"} className={css["t-minor"]} level={"h4"}>
            <span className={css["t-major"]}>Storiny</span> is the platform for
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
            Storiny is where you and your ideas belong! (Yes, we made up that
            line. We like to be creative here.) At our core, we believe that
            every person has a unique and valuable story that deserves to be
            shared with the world. We&apos;re not just saying that to sound
            fancy and inspirational; we really mean it.
            <br />
            <br />
            Whether your story is about personal growth, overcoming adversity,
            or finally getting your cat to stop scratching the couch, we want to
            hear it. We believe that by sharing our stories, we can inspire
            others to share theirs too, and, in turn, create a ripple effect of
            positivity and empowerment.
            <br />
            <br />
            If you have a story within you that is yet to be told, we invite you
            to join us and share it with the world. Your story has the power to
            inspire, heal, and create change. And if it&apos;s about your cat,
            we&apos;ll probably laugh too.
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
            The principle that knowledge should be accessible to everyone,
            without any barriers or restrictions holding them back, is one that
            we firmly stand by.
            <br />
            <br />
            We want to assure you that your stories will never be fenced behind
            paywalls because that’s just not how we roll. Our main objective is
            to foster a community where individuals can freely contribute and
            learn from one another without any impediments.
            <br />
            <br />
            Speaking of collaborative writing, you can invite users to hop on
            board and contribute to your stories. It&apos;s like having a team
            of co-authors, but without the arguments over who gets to be the
            protagonist. More power to you!
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
            In a world where knowledge is the ultimate power move, why should
            anyone be left behind? That&apos;s the question we posed to
            ourselves way back in 2021 when we noticed the conspicuous absence
            of a public blogging community without any paywalls or restrictions.
            And let&apos;s face it, who doesn&apos;t love nice things? So, we
            took it upon ourselves to build a platform where everyone could
            share their ideas without any strings attached.
          </Typography>
          <Typography level={"quote"}>
            &quot;Information should be free. It&apos;s an ethical imperative.
            Only information tied to a physical product should have a monetary
            cost attached to it.&quot; — Aaron Swartz
          </Typography>
          <Typography level={"legible"}>
            Consider it as a grandiose potluck celebration, where instead of
            bringing your preferred dish, you are offering your most ingenious
            ideas to the group. What&apos;s more, it is an unlimited buffet, and
            there are no undisclosed expenses or charges.
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
            We want to establish an all-inclusive platform, enabling individuals
            from diverse backgrounds to share their innovative ideas, that have
            the power to shape the way we think, live, and interact with one
            another.
            <br />
            <br />
            Our objective is to nurture a culture of creativity, empathy, and
            collaboration, where every idea is valued and celebrated. Regardless
            of whether you are an artist, entrepreneur, scientist, or just
            someone with a distinctive perspective, Storiny is tailor-made to
            amplify your voice and create a tangible impact on society.
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
            Please do not hesitate to reach out to us using any of the suitable
            means of contact listed below.
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

export * from "./metadata";
export default Page;
