import { clsx } from "clsx";
import Image from "next/image";
import React from "react";

import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import FileDownloadIcon from "~/icons/FileDownload";

import BrandInUseSection from "./sections/brand-in-use";
import ColorsSection from "./sections/colors";
import GetInTouchSection from "./sections/get-in-touch";
import LogoSection from "./sections/logo";
import TypographySection from "./sections/typography";
import styles from "./styles.module.scss";
import { VisuallyHidden } from "./visually-hidden";

const Page = (): React.ReactElement => (
  <>
    <div
      className={clsx("grid", "minimal", styles.x, styles.splash)}
      role={"presentation"}
    >
      <Image
        alt={""}
        className={"invert"}
        fill
        loading={"eager"}
        priority
        src={"web-assets/background/noise"}
        style={{ objectFit: "cover" }}
      />
      <Image
        alt={""}
        fill
        loading={"eager"}
        priority
        src={"web-assets/branding/splash"}
        style={{ objectFit: "cover" }}
      />
      <div className={clsx(styles.x, styles.container)}>
        <Typography className={"t-minor"} level={"body2"}>
          Version: 14 April, 2023
        </Typography>
      </div>
    </div>
    <article className={clsx("flex-col", styles.x, styles.article)}>
      <VisuallyHidden asChild>
        <h1>Media kit</h1>
      </VisuallyHidden>
      <section className={clsx(styles.x, styles.section)}>
        <Typography
          as={"h2"}
          className={clsx("fit-h", styles.x, styles["section-title"])}
          level={"display2"}
        >
          The Storiny Brand
        </Typography>
        <div className={clsx("flex-col", styles.x, styles["section-content"])}>
          <Typography level={"legible"}>
            The Storiny brand is made up of some pretty recognizable assets –
            you&apos;ve probably seen them around. To ensure the appropriate use
            of our brand resources and avoid any potential missteps, we have
            created a comprehensive guide that outlines the do&apos;s and
            don&apos;ts when utilizing them.
            <br />
            <br />
            Additionally, our{" "}
            <Link href={"/about"} underline={"always"}>
              About us
            </Link>{" "}
            page serves as an ideal source to acquaint yourself with our
            company&apos;s history, mission statement, and operational
            practices.
          </Typography>
          <div className={clsx("flex-center", styles.x, styles.action)}>
            <Button
              as={"a"}
              decorator={<FileDownloadIcon />}
              href={process.env.NEXT_PUBLIC_MEDIA_KIT_DROPBOX_LINK}
              rel={"noreferrer"}
              size={"lg"}
              target={"_blank"}
            >
              Download asset kit
            </Button>
          </div>
        </div>
      </section>
      <Divider />
      <LogoSection />
      <Divider />
      <ColorsSection />
      <Divider />
      <TypographySection />
      <Divider />
      <BrandInUseSection />
      <Divider />
      <GetInTouchSection />
    </article>
    <Spacer orientation={"vertical"} size={10} />
  </>
);

export default Page;
