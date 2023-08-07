"use client";

import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";

import Image from "~/components/Image";
import Link from "~/components/Link";

import { selectedAtom } from "../../../atoms";
import commonStyles from "../common.module.scss";
import styles from "./PexelsItem.module.scss";
import { PexelsItemProps } from "./PexelsItem.props";

const PexelsMasonryItem = React.memo(
  ({ data }: PexelsItemProps): React.ReactElement => {
    const [selected, setSelected] = useAtom(selectedAtom);
    const isSelected = selected?.id === String(data.id);

    /**
     * Handles selection
     */
    const handleSelect = (): void => {
      setSelected({
        src: data.src.medium,
        id: String(data.id),
        hex: (data.avg_color || "").substring(1)
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
        <Image
          alt={data.alt || ""}
          className={commonStyles.image}
          hex={(data.avg_color || "").substring(1)}
          slotProps={{
            image: {
              className: commonStyles["image-child"]
            },
            fallback: {
              style: { display: "none" }
            }
          }}
          src={data.src.medium}
          style={{
            width: "100%",
            paddingTop: `${(data.height / data.width) * 100}%`
          }}
        />
        <div className={clsx("flex-col", styles.overlay)}>
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
