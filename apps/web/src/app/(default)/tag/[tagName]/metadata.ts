import type { Metadata } from "next";

type Props = {
  params: { tagName: string };
};

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => ({
  title: `#${params.tagName}`
});
