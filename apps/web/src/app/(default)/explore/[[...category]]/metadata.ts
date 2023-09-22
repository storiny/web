import { CATEGORY_LABEL_MAP } from "@storiny/shared";
import { Metadata } from "next";

import { CATEGORIES } from "../categories";

interface Props {
  params: { category: string[] };
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const categorySegment = (params.category || [])[0];
  const category = CATEGORIES.find((item) => item === categorySegment) || "all";
  const label = CATEGORY_LABEL_MAP[category];

  return {
    title: `Explore${
      category ? ` ${category === "diy" ? "DIY" : label.toLowerCase()}` : ""
    }`,
    description: "Explore stories, writers, and tags on Storiny"
  };
};
