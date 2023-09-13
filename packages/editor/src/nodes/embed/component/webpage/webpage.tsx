import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import ExternalLinkIcon from "~/icons/ExternalLink";
import LinkIcon from "~/icons/Link";

import styles from "./webpage.module.scss";
import { WebpageEmbedProps } from "./webpage.props";

const WebpageEmbed = ({
  metadata,
  selected
}: WebpageEmbedProps): React.ReactElement => {
  const isLargeCard = Boolean(!metadata.image || metadata.image?.is_large);
  return (
    <div
      className={clsx(
        isLargeCard ? "flex-col" : "flex-center",
        styles.x,
        styles.webpage,
        selected && styles.selected,
        !isLargeCard && styles.small
      )}
    >
      {isLargeCard ? (
        <React.Fragment>
          <div className={clsx("flex", styles.x, styles.header)}>
            <Persona
              avatar={{
                alt: "",
                src: metadata.favicon || undefined,
                label: metadata.title || "Unknown site"
              }}
              primaryText={metadata.title || "Unknown site"}
              secondaryText={new URL(metadata.url).host || ""}
              style={{ alignItems: "flex-start" }}
            />
            <Spacer className={"f-grow"} />
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
            <div className={clsx("flex", styles.x, styles.footer)}>
              <Typography className={"t-minor"} level={"body2"}>
                {metadata.description}
              </Typography>
            </div>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className={clsx(styles.x, styles["small-image-wrapper"])}>
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
          <div className={clsx("flex-col", styles.x, styles.body)}>
            <Link
              fixedColor
              href={metadata.url}
              level={"h6"}
              rel={"noreferrer"}
              target={"_blank"}
              title={metadata.url}
            >
              {metadata.title || "Unknown site"}
            </Link>
            {metadata.description && (
              <Typography className={"t-minor"} level={"body2"}>
                {metadata.description}
              </Typography>
            )}
            <Spacer className={"f-grow"} orientation={"vertical"} size={2.5} />
            <div
              className={clsx("flex-center", styles.x, styles["small-footer"])}
            >
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
