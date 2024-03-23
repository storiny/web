import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import ExternalLinkIcon from "~/icons/external-link";
import LinkIcon from "~/icons/link";
import css from "~/theme/main.module.scss";

import styles from "./webpage.module.scss";
import { WebpageEmbedProps } from "./webpage.props";

const WebpageEmbed = ({
  metadata,
  selected
}: WebpageEmbedProps): React.ReactElement => {
  const is_large_card = Boolean(!metadata.image || metadata.image?.is_large);
  return (
    <div
      className={clsx(
        css[is_large_card ? "flex-col" : "flex-center"],
        styles.webpage,
        selected && styles.selected,
        !is_large_card && styles.small
      )}
    >
      {is_large_card ? (
        <React.Fragment>
          <div className={clsx(css["flex"], styles.header)}>
            <Persona
              avatar={{
                alt: "",
                src: metadata.favicon || undefined,
                label: metadata.title || "Unknown site"
              }}
              primary_text={metadata.title || "Unknown site"}
              secondary_text={new URL(metadata.url).host || ""}
              style={{ alignItems: "flex-start" }}
            />
            <Spacer className={css["f-grow"]} />
            <IconButton
              as={NextLink}
              href={metadata.url}
              rel={"noreferrer"}
              target={"_blank"}
              title={metadata.url}
              variant={"ghost"}
            >
              <ExternalLinkIcon />
            </IconButton>
          </div>
          {metadata.image && metadata.image.is_large ? (
            <AspectRatio
              as={NextLink}
              href={metadata.url}
              ratio={1.9}
              rel={"noreferrer"}
              target={"_blank"}
              title={metadata.url}
            >
              <Image alt={metadata.image.alt || ""} src={metadata.image.src} />
            </AspectRatio>
          ) : null}
          {metadata.description && (
            <div className={clsx(css["flex"], styles.footer)}>
              <Typography color={"minor"} level={"body2"}>
                {metadata.description}
              </Typography>
            </div>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className={styles["small-image-wrapper"]}>
            <AspectRatio
              as={NextLink}
              className={clsx(styles.x, styles["small-image"])}
              href={metadata.url}
              ratio={1}
              rel={"noreferrer"}
              target={"_blank"}
              title={metadata.url}
            >
              <Image
                alt={metadata.image?.alt || ""}
                src={metadata.image?.src}
              />
            </AspectRatio>
          </div>
          <div className={clsx(css["flex-col"], styles.body)}>
            <Link
              fixed_color
              href={metadata.url}
              level={"h6"}
              rel={"noreferrer"}
              target={"_blank"}
              title={metadata.url}
            >
              {metadata.title || "Unknown site"}
            </Link>
            {metadata.description && (
              <Typography color={"minor"} level={"body2"}>
                {metadata.description}
              </Typography>
            )}
            <Spacer
              className={css["f-grow"]}
              orientation={"vertical"}
              size={2.5}
            />
            <div className={clsx(css["flex-center"], styles["small-footer"])}>
              <LinkIcon />
              <Link href={metadata.url} level={"body2"} title={metadata.url}>
                {new URL(metadata.url).host || ""}
              </Link>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default WebpageEmbed;
