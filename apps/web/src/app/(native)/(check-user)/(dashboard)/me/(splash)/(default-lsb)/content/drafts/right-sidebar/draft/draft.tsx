import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import DateTime from "~/components/date-time";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import Typography from "~/components/typography";
import EditIcon from "~/icons/edit";
import ImageIcon from "~/icons/image";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { DateFormat } from "~/utils/format-date";

import styles from "./draft.module.scss";
import { DraftProps } from "./draft.props";

const Draft = (props: DraftProps): React.ReactElement => {
  const { latest_draft } = props;
  const href = `/doc/${latest_draft.id}`;

  return (
    <article className={styles.draft}>
      <AspectRatio
        aria-label={"Edit this draft"}
        as={NextLink}
        className={clsx(css["full-w"], styles.x, styles.splash)}
        href={href}
        ratio={1.76}
        title={"Edit this draft"}
      >
        {!latest_draft.splash_id ? (
          <div className={clsx(css["flex-center"], styles.placeholder)}>
            <ImageIcon />
          </div>
        ) : (
          <Image
            alt={""}
            hex={latest_draft.splash_hex}
            img_key={latest_draft.splash_id}
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
      <div className={clsx(css["flex-col"], styles.meta)}>
        <Link
          className={css["t-medium"]}
          fixed_color
          href={href}
          level={"body2"}
          title={latest_draft.title}
        >
          {latest_draft.title}
        </Link>
        <footer className={css["flex"]}>
          <Typography
            className={clsx(css["t-minor"], css["t-medium"])}
            level={"body3"}
          >
            {abbreviate_number(latest_draft.word_count)} words{" "}
            <span className={css["t-muted"]}>&bull;</span> Edited{" "}
            <DateTime
              date={latest_draft.edited_at || latest_draft.created_at}
              format={DateFormat.RELATIVE}
            />
          </Typography>
        </footer>
      </div>
    </article>
  );
};

export default Draft;
