"use client";

import { AssetRating } from "@storiny/shared";
import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Image from "~/components/Image";
import Link from "~/components/Link";

import { selectedAtom } from "../../../atoms";
import commonStyles from "../common.module.scss";
import styles from "./pexels-item.module.scss";
import { PexelsItemProps } from "./pexels-item.props";

const PexelsMasonryItem = React.memo(
  ({ data }: PexelsItemProps): React.ReactElement => {
    const [selected, setSelected] = useAtom(selectedAtom);
    const isSelected = selected?.key === String(data.id);

    /**
     * Handles selection
     */
    const handleSelect = (): void => {
      setSelected({
        src: data.src.medium,
        key: String(data.id),
        rating: AssetRating.NOT_RATED,
        hex: (data.avg_color || "").substring(1),
        alt: data.alt || "",
        width: data.width,
        height: data.height,
        source: "pexels",
        credits: {
          author: data.photographer,
          url: data.url
        }
      });
    };

    return (
      <div
        className={clsx(
          "focusable",
          "flex-center",
          commonStyles["image-wrapper"]
        )}
        data-selected={String(isSelected)}
        onClick={handleSelect}
        onKeyUp={(event): void => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSelect();
          }
        }}
        role={"button"}
        tabIndex={0}
      >
        <AspectRatio
          className={commonStyles.image}
          ratio={data.width / data.height}
        >
          <Image
            alt={data.alt || ""}
            hex={(data.avg_color || "").substring(1)}
            slot_props={{
              fallback: {
                style: { display: "none" }
              }
            }}
            src={data.src.medium}
          />
        </AspectRatio>
        <div className={clsx("flex-col", commonStyles.overlay, styles.overlay)}>
          <Link
            className={styles.link}
            ellipsis
            href={`${data.url}?utm_source=storiny`}
            level={"body2"}
            target={"_blank"}
            title={`Photo by ${data.photographer} on Pexels`}
          >
            {data.photographer}
          </Link>
        </div>
      </div>
    );
  }
);

PexelsMasonryItem.displayName = "PexelsMasonryItem";

export default PexelsMasonryItem;
