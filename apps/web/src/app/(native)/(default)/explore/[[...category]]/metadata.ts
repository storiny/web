import { CATEGORY_LABEL_MAP } from "@storiny/shared/src/constants/category-icon-map";
import { Metadata } from "next";

import { CATEGORIES } from "../categories";

export const generateMetadata = async ({
  params
}: {
  params: Promise<{ category: string[] }>;
}): Promise<Metadata> => {
  const category_segment = ((await params).category || [])[0];
  const category =
    CATEGORIES.find((item) => item === category_segment) || "all";
  const label = CATEGORY_LABEL_MAP[category];

  return {
    title: `Explore${
      category ? ` ${category === "diy" ? "DIY" : label.toLowerCase()}` : ""
    }`,
    description: "Explore stories, writers, and tags on Storiny."
  };
};
