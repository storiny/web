"use client";

import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  StoryCategory
} from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import React from "react";

import Divider from "../../../../../../../../packages/ui/src/components/divider";
import Option, {
  OptionProps
} from "../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../packages/ui/src/components/select";
import { use_media_query } from "../../../../../../../../packages/ui/src/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

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
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
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
        value_children={
          is_mobile ? CATEGORY_ICON_MAP[segment || "all"] : undefined
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
