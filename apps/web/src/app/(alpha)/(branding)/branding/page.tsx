import { clsx } from "clsx";
import Image from "next/image";
import React from "react";

import Button from "~/components/button";
import Divider from "~/components/divider";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import FileDownloadIcon from "~/icons/file-download";
import css from "~/theme/main.module.scss";

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
      className={clsx(css["grid"], css["minimal"], styles.splash)}
      role={"presentation"}
    >
      <Image
        alt={""}
        data-invert-filter={""}
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
      <div className={styles.container}>
        <Typography className={css["t-minor"]} level={"body2"}>
          Version: 14 April, 2023
        </Typography>
      </div>
    </div>
    <article className={clsx(css["flex-col"], styles.article)}>
      <VisuallyHidden asChild>
        <h1>Media kit</h1>
      </VisuallyHidden>
      <section className={styles.section}>
        <Typography
          as={"h2"}
          className={clsx(css["fit-h"], styles.x, styles["section-title"])}
          level={"display2"}
        >
          The Storiny Brand
        </Typography>
        <div className={clsx(css["flex-col"], styles["section-content"])}>
          <Typography level={"legible"}>
            The Storiny brand is crafted with a clean and minimalistic design in
            mind. To ensure that our brand looks equally pleasing and maintains
            the same aesthetic, we have prepared this comprehensive guide that
            details the do&apos;s and don&apos;ts when using our brand resource
            for advertising or marketing purposes.
            <br />
            <br />
            If you need to know more about Storiny and our mission statement,
            please visit our{" "}
            <Link href={"/about"} underline={"always"}>
              About us
            </Link>{" "}
            page.
          </Typography>
          <div className={clsx(css["flex-center"], styles.action)}>
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

export { metadata } from "./metadata";
export default Page;
