"use client";

/* eslint-disable @next/next/no-img-element */

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import Link from "~/components/link";
import NoSsr from "~/components/no-ssr";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import page_styles from "../../styles.module.scss";
import common_styles from "../common.module.scss";

const PrimaryTypeface = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], page_styles["sub-section"])}>
    <Typography level={"h3"}>Primary Typeface</Typography>
    <Typography level={"legible"}>
      Our primary typeface is Cabinet Grotesk.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure
      className={clsx(
        css["flex-col"],
        css["t-center"],
        page_styles.figure,
        page_styles["with-background"],
        common_styles["figure-with-caption"]
      )}
    >
      <img
        alt={""}
        data-invert-filter={""}
        loading={"lazy"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/typography/primary-typeface.svg`}
      />
      <Spacer orientation={"vertical"} size={2} />
      <Typography as={"figcaption"} color={"minor"} level={"body2"}>
        Typeface: Cabinet Grotesk
      </Typography>
    </figure>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"legible"}>
      Cabinet Grotesk is a contemporary font family with distinct design
      features. Although classified as a sans-serif, its letters incorporate a
      unique stroke-contrast. This contrast lends itself well to headings and
      larger text, providing a visually appealing element.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h4"}>Usage</Typography>
    <Typography level={"legible"}>
      Cabinet Grotesk is primarily used as our primary typeface for large texts,
      story titles, and headlines. In terms of headline composition, either
      title case or sentence case may be used, with the latter being the
      preferred choice. Moreover, a heavy font weight is applied to the headline
      to effectively emphasize its significance.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h5"}>Large headline</Typography>
    <Typography level={"legible"}>
      For concise headlines, a large headline variant is used. We use Cabinet
      Grotesk with the font weight set to &quot;Black&quot; to create a
      heightened emphasis on the headlines. To enhance compactness, the line
      height is set to 100% for shorter copies. For longer copies, a line height
      of 112% is used to ensure optimal legibility and readability.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div
      className={clsx(
        css["flex-col"],
        css["t-center"],
        common_styles["figure-with-caption"]
      )}
    >
      <div
        className={clsx(
          css["flex-col"],
          page_styles.figure,
          page_styles["with-background"]
        )}
        role={"presentation"}
      >
        <Typography as={"p"} level={"display2"}>
          Cabinet Grotesk Black
        </Typography>
      </div>
      <Typography color={"minor"} level={"body2"}>
        Large Headline — Font weight: Black, Line height: 112%
      </Typography>
    </div>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h5"}>Headline</Typography>
    <Typography level={"legible"}>
      Cabinet Grotesk is also used for normal and longer headlines. The font
      weight is set to &quot;Extrabold&quot; to create a strong emphasis. In
      contrast to the large headline variant, the line height for the normal
      headline is always set at 112%, regardless of the length of the headline.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div
      className={clsx(
        css["flex-col"],
        css["t-center"],
        common_styles["figure-with-caption"]
      )}
    >
      <div
        className={clsx(
          css["flex-col"],
          page_styles.figure,
          page_styles["with-background"]
        )}
        role={"presentation"}
      >
        <Typography as={"p"} level={"h1"}>
          Cabinet Grotesk Extrabold
        </Typography>
      </div>
      <Typography color={"minor"} level={"body2"}>
        Headline — Font weight: Extrabold, Line height: 112%
      </Typography>
    </div>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h5"}>Styling usernames</Typography>
    <Typography level={"legible"}>
      When representing your Storiny handle featuring your username, you have
      the option to choose between two distinct styles.
      <br />
      <br />
      The username combined with icon version requires placing the username next
      to the Storiny icon with sufficient clear space surrounding it, as
      specified in the icon usage guidelines. This option is preferred when you
      do not want to include your avatar or when the layout does not allow
      sufficient space for the icon to be legible, particularly at smaller
      sizes.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <div
      className={clsx(
        css["flex-col"],
        css["t-center"],
        common_styles["figure-with-caption"]
      )}
    >
      <figure
        className={clsx(
          css["flex-col"],
          page_styles.figure,
          page_styles["with-background"]
        )}
      >
        <img
          alt={""}
          data-invert-filter={""}
          loading={"lazy"}
          src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/lockups/default.svg`}
          style={{ maxHeight: "96px" }}
        />
      </figure>
      <Typography as={"figcaption"} color={"minor"} level={"body2"}>
        Username with the Storiny icon.
      </Typography>
    </div>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"legible"}>
      The other version allows placing your username adjacent to your avatar,
      which is masked with the Storiny icon. This style should only be used when
      the icon can displayed at a minimum width of 15 pixels, as specified in
      the icon usage guidelines. A template of this style is included in our
      asset kit.
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
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/lockups/avatar-template`}
      />
      <Typography as={"figcaption"} color={"minor"} level={"body2"}>
        Username with an avatar masked by the Storiny icon.
      </Typography>
    </figure>
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
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/lockups/samples`}
      />
      <Typography as={"figcaption"} color={"minor"} level={"body2"}>
        Some examples demonstrating the usage of the username with avatar
        version, featuring real avatars. Image credits (from left to right):{" "}
        <Link
          href={
            "https://www.pexels.com/photo/a-beautiful-woman-smiling-9784532/?utm_source=storiny"
          }
          target={"_blank"}
          underline={"always"}
        >
          Mikhail Nilov
        </Link>
        ,{" "}
        <Link
          href={"https://unsplash.com/photos/MEb2jandkbc/?utm_source=storiny"}
          target={"_blank"}
          underline={"always"}
        >
          Mikhail Vasilyev
        </Link>
        ,{" "}
        <Link
          href={"https://unsplash.com/photos/wEzRohCvSs4/?utm_source=storiny"}
          target={"_blank"}
          underline={"always"}
        >
          Ong Cheng Zheng
        </Link>
        , and{" "}
        <Link
          href={"https://unsplash.com/photos/aoEwuEH7YAs/?utm_source=storiny"}
          target={"_blank"}
          underline={"always"}
        >
          Lucas Gouvêa
        </Link>
        .
      </Typography>
    </figure>
  </div>
);

const SecondaryTypeface = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], page_styles["sub-section"])}>
    <Typography level={"h3"}>Secondary Typeface</Typography>
    <Typography level={"legible"}>
      Our secondary typeface is Satoshi.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <figure
      className={clsx(
        css["flex-col"],
        css["t-center"],
        page_styles.figure,
        page_styles["with-background"],
        common_styles["figure-with-caption"]
      )}
    >
      <img
        alt={""}
        data-invert-filter={""}
        loading={"lazy"}
        src={`${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/branding/typography/secondary-typeface.svg`}
      />
      <Spacer orientation={"vertical"} size={2} />
      <Typography as={"figcaption"} color={"minor"} level={"body2"}>
        Typeface: Satoshi
      </Typography>
    </figure>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"legible"}>
      Satoshi is a modern sans-serif typeface that incorporates a blend of
      grotesk-style letterforms and geometric design elements. Its appearance
      draws inspiration from the graphic and typographic design of the Modernism
      and Industrial-Era periods.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h4"}>Usage</Typography>
    <Typography level={"legible"}>
      We chose Satoshi as our preferred typeface for body and supporting text,
      as it enables optimal legibility across a range of screen sizes.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h5"}>Text length</Typography>
    <Typography level={"legible"}>
      For optimal legibility, it is recommended that each line contain between
      50 to 75 characters, or roughly 10 words. Too long or too short lines can
      negatively impact readability and should be avoided.
    </Typography>
    <Spacer orientation={"vertical"} size={5} />
    <Typography level={"h5"}>Line height</Typography>
    <Typography level={"legible"}>
      Satoshi is most legible at 175% line height for body text, such as large
      paragraphs, and 130% for supporting text, such as helper texts and labels.
    </Typography>
  </div>
);

const FallbackTypeface = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], page_styles["sub-section"])}>
    <Typography level={"h3"}>Fallback fonts</Typography>
    <Typography level={"legible"}>
      In rare cases where our recommended font families are not feasible, the
      following substitutes may be used. Please note that the username lockups
      must always use our primary typeface.
      <br />
      <br />
      For Cabinet Grotesk, our primary typeface, Helvetica with a 900 font
      weight may be used as a suitable alternative. Similarly, for Satoshi, our
      secondary typeface, Tahoma font at a font size of 16px and a letter
      spacing of -0.15px may be used as a replacement.
    </Typography>
  </div>
);

const TypographySection = (): React.ReactElement => {
  const is_tablet = use_media_query(BREAKPOINTS.down("tablet"));

  return (
    <section className={page_styles.section}>
      <Typography
        // Hide inner text to assistive technologies because of hyphen
        aria-label={"Typography"}
        as={"h2"}
        className={clsx(page_styles.x, page_styles["section-title"])}
        level={"display2"}
      >
        <NoSsr>
          <span aria-hidden>{is_tablet ? "Typography" : "Typo-graphy"}</span>
        </NoSsr>
      </Typography>
      <div className={clsx(css["flex-col"], page_styles["section-content"])}>
        <Typography level={"legible"}>
          Our typographical choice consists of a binary set of fonts: Cabinet
          Grotesk, a display font, and Satoshi, a legible sans-serif font. Both
          of these typefaces are designed by the Indian Type Foundry (ITF).
        </Typography>
        <PrimaryTypeface />
        <Divider />
        <SecondaryTypeface />
        <Divider />
        <FallbackTypeface />
      </div>
    </section>
  );
};

export default TypographySection;
