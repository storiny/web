/* eslint-disable @next/next/no-img-element */

import { clsx } from "clsx";
import React from "react";

import Logo from "~/brand/logo";
import Wordmark from "~/brand/wordmark";
import Divider from "~/components/divider";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import common_styles from "../common.module.scss";
import styles from "./logo.module.scss";

const LogoSpacingAndSize = (): React.ReactElement => (
  <>
    <Typography level={"h4"}>Spacing & Size</Typography>
    <Typography level={"legible"}>
      Give the Storiny logo some space to breathe, don&apos;t crowd it like
      it&apos;s a concert mosh pit. Leave at least 50% of the icon&apos;s width
      as clear space around the logo.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure className={clsx(css["flex-center"], page_styles.figure)}>
      <img
        alt={""}
        data-invert-filter={""}
        loading={"lazy"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/wordmark/spacing.svg`}
      />
    </figure>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"legible"}>
      The Storiny logo should always be at least 72 pixels wide to ensure that
      it retains its recognizable traits and distinctiveness, even when scaled
      down.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure className={clsx(css["flex-center"], page_styles.figure)}>
      <img
        alt={""}
        data-invert-filter={""}
        loading={"lazy"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/wordmark/minimum-size.svg`}
        style={{ maxHeight: "84px" }}
      />
    </figure>
  </>
);

const LogoColor = (): React.ReactElement => (
  <>
    <Typography level={"h4"}>Color</Typography>
    <Typography level={"legible"}>
      The Storiny logo is intended to be displayed in monochrome, with a color
      that closely resembles pure white (The Storiny Snow color) or pure black
      (The Storiny Obsidian color) as defined in our brand colors.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div className={clsx(css["flex-col"], styles["logo-color"])}>
      <figure
        className={clsx(
          css["flex-center"],
          "force-light-mode",
          page_styles.figure,
          page_styles["with-background"]
        )}
      >
        <Wordmark size={"lg"} />
      </figure>
      <figure
        className={clsx(
          css["flex-center"],
          "force-dark-mode",
          page_styles.figure,
          page_styles["with-background"]
        )}
      >
        <Wordmark size={"lg"} />
      </figure>
    </div>
  </>
);

const LogoMisuse = (): React.ReactElement => (
  <>
    <Typography level={"h4"}>Misuse</Typography>
    <Typography level={"legible"}>
      Kindly refrain from incorrect usage of the Storiny logo. Below are some
      examples of such incorrect usage for your reference.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div className={clsx(css["flex-col"], styles["misuse-container"])}>
      <FigureWithCaption
        caption={
          "Do not change the orientation of the logo elements or alter the icon."
        }
        src={"web-assets/branding/wordmark/misuse/001"}
      />
      <FigureWithCaption
        caption={
          "Do not rotate the logo or change the position of the elements within the logo."
        }
        src={"web-assets/branding/wordmark/misuse/002"}
      />
      <FigureWithCaption
        caption={
          "Do not use the logo without the icon, and do not modify the typeface of the wordmark."
        }
        src={"web-assets/branding/wordmark/misuse/003"}
      />
      <FigureWithCaption
        caption={"Do not create a silhouette outline or distort the logo."}
        src={"web-assets/branding/wordmark/misuse/004"}
      />
      <FigureWithCaption
        caption={
          "Avoid having mismatched colors between the logo and the wordmark, and avoid adding shadows to the logo."
        }
        src={"web-assets/branding/wordmark/misuse/005"}
      />
      <FigureWithCaption
        caption={
          "Do not add colors or gradients besides the ones specified in the usage guidelines."
        }
        src={"web-assets/branding/wordmark/misuse/006"}
      />
    </div>
  </>
);

const IconSpacingAndSize = (): React.ReactElement => (
  <>
    <Typography level={"h4"}>Spacing & Size</Typography>
    <Typography level={"legible"}>
      To ensure the legibility of the Storiny icon, it is advisable to allocate
      adequate clear space around it. A good rule of thumb is to leave at least
      150% of its width as empty space around it.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure className={clsx(css["flex-center"], page_styles.figure)}>
      <img
        alt={""}
        data-invert-filter={""}
        loading={"lazy"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/icon/spacing.svg`}
      />
    </figure>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"legible"}>
      The Storiny icon should never be scaled down below 15 pixels in width to
      maintain its distinctive charm and prevent it from becoming
      unrecognizable.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure className={clsx(css["flex-center"], page_styles.figure)}>
      <img
        alt={""}
        data-invert-filter={""}
        loading={"lazy"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/icon/minimum-size.svg`}
        style={{ maxHeight: "96px" }}
      />
    </figure>
  </>
);

const IconColor = (): React.ReactElement => (
  <>
    <Typography level={"h4"}>Color</Typography>
    <Typography level={"legible"}>
      The Storiny icon follows the same monochromatic colors as those defined
      for the Storiny logo.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div className={clsx(css["flex-col"], styles["logo-color"])}>
      <figure
        className={clsx(
          css["flex-center"],
          "force-light-mode",
          page_styles.figure,
          page_styles["with-background"]
        )}
      >
        <Logo size={96} />
      </figure>
      <figure
        className={clsx(
          css["flex-center"],
          "force-dark-mode",
          page_styles.figure,
          page_styles["with-background"]
        )}
      >
        <Logo size={96} />
      </figure>
    </div>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"legible"}>
      Use the white version of the Storiny icon when overlaying it onto an
      image. It is essential to maintain sufficient contrast between the Storiny
      icon and the background to ensure that the icon is clearly visible and
      effectively communicates its intended message to the viewer.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure
      className={clsx(
        css["flex-col"],
        css["t-center"],
        page_styles.figure,
        common_styles["figure-with-caption"],
        common_styles["image-with-border"]
      )}
    >
      <img
        alt={""}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/icon/overlay`}
      />
      <Typography as={"figcaption"} className={css["t-minor"]} level={"body2"}>
        The Storiny icon being overlaid on top of an image. Image credit:{" "}
        <Link
          href={"https://unsplash.com/photos/IxnPudNyaz0?utm_source=storiny"}
          target={"_blank"}
          underline={"always"}
        >
          Colton Duke
        </Link>
      </Typography>
    </figure>
  </>
);

const IconMisuse = (): React.ReactElement => (
  <>
    <Typography level={"h4"}>Misuse</Typography>
    <Typography level={"legible"}>
      Kindly refrain from incorrect usage of the Storiny icon. Below are some
      examples of such incorrect usage for your reference.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div className={clsx(css["flex-col"], styles["misuse-container"])}>
      <FigureWithCaption
        caption={
          "Do not rotate or distort the icon, and do not add colors or gradients that are not specified in the usage guidelines."
        }
        src={"web-assets/branding/icon/misuse/001"}
      />
      <FigureWithCaption
        caption={
          "Do not create a silhouette outline or add a border to the icon. Moreover, avoid applying shadows or altering the structure of the icon."
        }
        src={"web-assets/branding/icon/misuse/002"}
      />
    </div>
  </>
);

const FigureWithCaption = ({
  src,
  caption
}: {
  caption: React.ReactNode;
  src: string;
}): React.ReactElement => (
  <figure
    className={clsx(
      css["flex-col"],
      css["t-center"],
      page_styles.figure,
      common_styles["figure-with-caption"]
    )}
  >
    <img
      alt={""}
      data-invert-filter={""}
      src={`${process.env.NEXT_PUBLIC_CDN_URL}/${src}`}
    />
    <Typography as={"figcaption"} className={css["t-minor"]} level={"body2"}>
      {caption}
    </Typography>
  </figure>
);

const LogoSection = (): React.ReactElement => (
  <section className={page_styles.section}>
    <Typography
      as={"h2"}
      className={clsx(page_styles.x, page_styles["section-title"])}
      level={"display2"}
    >
      Logo
    </Typography>
    <div className={clsx(css["flex-col"], page_styles["section-content"])}>
      <Typography level={"legible"}>
        We take great pride in our minimal and memorable logo design, and how it
        represents our brand. In order to preserve its visual integrity, we
        kindly request that you follow the guidelines outlined below when using
        it.
      </Typography>
      <div className={clsx(css["flex-col"], page_styles["sub-section"])}>
        <Typography level={"h3"}>The Storiny Logo</Typography>
        <Typography level={"legible"}>
          Our logo is comprised of a contemporary wordmark and icon, which
          together create a clean and pleasing aesthetic.
        </Typography>
        <Spacer orientation={"vertical"} size={5} />
        <figure
          className={clsx(
            css["flex-center"],
            page_styles.figure,
            page_styles["with-background"]
          )}
        >
          <img
            alt={""}
            data-invert-filter={""}
            loading={"lazy"}
            src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/wordmark/wordmark.svg`}
          />
        </figure>
        <Spacer orientation={"vertical"} size={5} />
        <Typography level={"legible"}>
          The wordmark should not be used without the icon as they complement
          each other. However, in certain cases specified in these guidelines,
          the icon can be used as a standalone element.
        </Typography>
        <Spacer orientation={"vertical"} size={5} />
        <LogoSpacingAndSize />
        <Spacer orientation={"vertical"} size={5} />
        <LogoColor />
        <Spacer orientation={"vertical"} size={5} />
        <LogoMisuse />
      </div>
      <Divider />
      <div className={clsx(css["flex-col"], page_styles["sub-section"])}>
        <Typography level={"h3"}>The Storiny Icon</Typography>
        <Typography level={"legible"}>
          The use of the Storiny icon as a standalone element is permissible in
          situations where there is insufficient space for the complete logo, or
          when the Storiny brand is explicitly referenced elsewhere on the page.
        </Typography>
        <Spacer orientation={"vertical"} size={5} />
        <figure
          className={clsx(
            css["flex-center"],
            page_styles.figure,
            page_styles["with-background"]
          )}
        >
          <img
            alt={""}
            data-invert-filter={""}
            loading={"lazy"}
            src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/icon/icon.svg`}
            style={{ maxHeight: "220px" }}
          />
        </figure>
        <Spacer orientation={"vertical"} size={5} />
        <IconSpacingAndSize />
        <Spacer orientation={"vertical"} size={5} />
        <IconColor />
        <Spacer orientation={"vertical"} size={5} />
        <IconMisuse />
      </div>
      <Divider />
      <div className={clsx(css["flex-col"], page_styles["sub-section"])}>
        <Typography level={"h3"}>Color combinations</Typography>
        <Typography level={"legible"}>
          The Storiny icon and the Storiny logo must always be displayed in
          either black or white, as indicated in our usage guidelines, and no
          other colors are allowed. However, you are free to choose the
          background for our brand assets, as long as there is sufficient
          contrast between them and your background.
        </Typography>
        <Spacer orientation={"vertical"} size={5} />
        <figure
          className={clsx(
            css["flex-col"],
            page_styles.figure,
            common_styles["image-with-border"]
          )}
        >
          <img
            alt={""}
            src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/color-combinations`}
          />
        </figure>
      </div>
    </div>
  </section>
);

export default LogoSection;
