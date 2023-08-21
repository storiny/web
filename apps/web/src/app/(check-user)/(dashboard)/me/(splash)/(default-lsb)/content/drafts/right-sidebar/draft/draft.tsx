import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Link from "~/components/Link";
import Typography from "~/components/Typography";
import EditIcon from "~/icons/Edit";
import ImageIcon from "~/icons/Image";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import styles from "./draft.module.scss";
import { DraftProps } from "./draft.props";

const Draft = (props: DraftProps): React.ReactElement => {
  const { latest_draft } = props;
  const href = `/me/content/drafts/${latest_draft.id}`;

  return (
    <article className={clsx(styles.x, styles.draft)}>
      <AspectRatio
        aria-label={"Edit this draft"}
        as={NextLink}
        className={clsx("full-w", styles.x, styles.splash)}
        href={href}
        ratio={1.76}
        title={"Edit this draft"}
      >
        {!latest_draft.splash_id ? (
          <div className={clsx("flex-center", styles.x, styles.placeholder)}>
            <ImageIcon />
          </div>
        ) : (
          <Image
            alt={""}
            hex={latest_draft.splash_hex}
            imgId={latest_draft.splash_id}
            size={ImageSize.W_320}
          />
        )}
        <IconButton
          aria-label={"Edit this draft"}
          className={clsx("force-light-mode", styles.x, styles["edit-button"])}
        >
          <EditIcon />
        </IconButton>
      </AspectRatio>
      <div className={clsx("flex-col", styles.x, styles.meta)}>
        <Link
          className={"t-medium"}
          fixedColor
          href={href}
          level={"body2"}
          title={latest_draft.title}
        >
          {latest_draft.title}
        </Link>
        <footer className={"flex"}>
          <Typography className={clsx("t-minor", "t-medium")} level={"body3"}>
            {abbreviateNumber(latest_draft.word_count)} words{" "}
            <span className={"t-muted"}>&bull;</span> Edited{" "}
            {formatDate(
              latest_draft.edited_at || latest_draft.created_at,
              DateFormat.RELATIVE
            )}
          </Typography>
        </footer>
      </div>
    </article>
  );
};

export default Draft;
