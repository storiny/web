"use client";

import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  StoryCategory
} from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import React from "react";

import Divider from "~/components/Divider";
import Option, { OptionProps } from "~/components/Option";
import Select from "~/components/Select";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./dropdown.module.scss";

// Anchor option

const AnchorOption = ({
  children,
  value,
  ...rest
}: Omit<OptionProps, "value"> & {
  value: StoryCategory | "all";
}): React.ReactElement => (
  <Option {...rest} value={value}>
    {children}
  </Option>
);

const DropdownClient = (): React.ReactElement => {
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const router = useRouter();
  const segment = useSelectedLayoutSegment();

  return (
    <>
      <Divider orientation={"vertical"} />
      <Select
        onValueChange={(value): void =>
          router.push(`/explore${value === "all" ? "" : `/${value}`}`)
        }
        size={"lg"}
        slot_props={{
          trigger: {
            className: clsx(
              "focus-invert",
              "ellipsis",
              styles.x,
              styles.trigger
            )
          }
        }}
        value={segment || "all"}
        valueChildren={
          isMobile ? CATEGORY_ICON_MAP[segment || "all"] : undefined
        }
      >
        {(
          [
            "all",
            StoryCategory.SCIENCE_AND_TECHNOLOGY,
            StoryCategory.PROGRAMMING,
            StoryCategory.LIFESTYLE,
            StoryCategory.HEALTH_AND_WELLNESS,
            StoryCategory.ENTERTAINMENT,
            StoryCategory.DIGITAL_GRAPHICS,
            StoryCategory.TRAVEL,
            StoryCategory.DIY,
            StoryCategory.NEWS,
            StoryCategory.SPORTS,
            StoryCategory.GAMING,
            StoryCategory.MUSIC,
            StoryCategory.LEARNING,
            StoryCategory.BUSINESS_AND_FINANCE
          ] as ("all" | StoryCategory)[]
        ).map((category) => (
          <AnchorOption
            decorator={CATEGORY_ICON_MAP[category]}
            key={category}
            value={category}
          >
            {CATEGORY_LABEL_MAP[category]}
          </AnchorOption>
        ))}
      </Select>
    </>
  );
};

export default DropdownClient;
