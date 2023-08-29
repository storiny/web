import React from "react";

import ImageIcon from "~/icons/Image";

import InsertItem from "../insert-item";

const ImageItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <InsertItem decorator={<ImageIcon />} disabled={disabled} label={"Image"} />
);

export default ImageItem;
