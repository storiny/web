"use client";

import { StoryCategory } from "@storiny/shared";
import { CATEGORY_ICON_MAP } from "@storiny/shared/src/constants/category-icon-map";
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
        slotProps={{
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
        <AnchorOption decorator={CATEGORY_ICON_MAP.all} value={"all"}>
          All categories
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP["science-and-technology"]}
          value={StoryCategory.SCIENCE_AND_TECHNOLOGY}
        >
          Science & technology
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.programming}
          value={StoryCategory.PROGRAMMING}
        >
          Programming
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.lifestyle}
          value={StoryCategory.LIFESTYLE}
        >
          Lifestyle
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP["health-and-wellness"]}
          value={StoryCategory.HEALTH_AND_WELLNESS}
        >
          Health & wellness
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.entertainment}
          value={StoryCategory.ENTERTAINMENT}
        >
          Entertainment
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP["digital-graphics"]}
          value={StoryCategory.DIGITAL_GRAPHICS}
        >
          Digital graphics
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.travel}
          value={StoryCategory.TRAVEL}
        >
          Travel
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.diy}
          value={StoryCategory.DIY}
        >
          DIY
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.news}
          value={StoryCategory.NEWS}
        >
          News
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.sports}
          value={StoryCategory.SPORTS}
        >
          Sports
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.gaming}
          value={StoryCategory.GAMING}
        >
          Gaming
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.music}
          value={StoryCategory.MUSIC}
        >
          Music
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP.learning}
          value={StoryCategory.LEARNING}
        >
          Learning
        </AnchorOption>
        <AnchorOption
          decorator={CATEGORY_ICON_MAP["business-and-finance"]}
          value={StoryCategory.BUSINESS_AND_FINANCE}
        >
          Business & finance
        </AnchorOption>
      </Select>
    </>
  );
};

export default DropdownClient;
