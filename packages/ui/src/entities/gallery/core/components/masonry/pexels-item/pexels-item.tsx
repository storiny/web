"use client";

import { AssetRating } from "@storiny/shared";
import clsx from "clsx";
import { useAtom as use_atom } from "jotai";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Image from "~/components/image";
import Link from "~/components/link";

import { selected_atom } from "../../../atoms";
import common_styles from "../common.module.scss";
import styles from "./pexels-item.module.scss";
import { PexelsItemProps } from "./pexels-item.props";

const PexelsMasonryItem = React.memo(
  ({ data }: PexelsItemProps): React.ReactElement => {
    const [selected, set_selected] = use_atom(selected_atom);
    const is_selected = selected?.key === String(data.id);

    /**
     * Handles selection
     */
    const handle_select = (): void => {
      set_selected({
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
          common_styles["image-wrapper"]
        )}
        data-selected={String(is_selected)}
        onClick={handle_select}
        onKeyUp={(event): void => {
          if (event.key === "Enter") {
            event.preventDefault();
            handle_select();
          }
        }}
        role={"button"}
        tabIndex={0}
      >
        <AspectRatio
          className={common_styles.image}
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
        <div
          className={clsx("flex-col", common_styles.overlay, styles.overlay)}
        >
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
