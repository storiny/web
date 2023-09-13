export interface WebpageMetadata {
  description: string;
  embed_type: "metadata";
  favicon: string | null;
  host: string;
  image: null | {
    alt: string | null;
    height: number | null;
    is_large: boolean;
    src: string;
    width: number | null;
  };
  title: string;
  url: string;
}

export interface WebpageEmbedProps {
  metadata: WebpageMetadata;
  selected: boolean;
}
