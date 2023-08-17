import type { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: { username: string };
};

export const generateMetadata = async (
  { params }: Props,
  parent?: ResolvingMetadata
): Promise<Metadata> => {
  const previousImages = (await parent)?.openGraph?.images || [];

  return {
    title: `@${params.username}` || "Unknown",
    openGraph: {
      images: previousImages
    }
  };
};
