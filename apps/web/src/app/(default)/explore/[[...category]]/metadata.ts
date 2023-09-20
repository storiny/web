import { Metadata } from "next";

import { CATEGORIES } from "../categories";

interface Props {
  params: { category: string[] };
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const categorySegment = (params.category || [])[0];
  const category = CATEGORIES.find((item) => item.id === categorySegment);

  return {
    title: `Explore${
      category
        ? ` ${category.id === "diy" ? "DIY" : category.title.toLowerCase()}`
        : ""
    }`,
    description: "Explore stories, writers, and tags on Storiny"
  };
};
