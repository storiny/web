import { Metadata as TMetadata } from "next";
import React from "react";

interface Props {
  metadata: TMetadata;
}

// Title and description for segmented layout
const Metadata = ({ metadata }: Props): React.ReactElement => (
  <>
    <title>{metadata.title as string}</title>
    {metadata.description && (
      <meta content={metadata.description} name="description" />
    )}
  </>
);

export default Metadata;
