import React from "react";

import MenuItem from "~/components/MenuItem";
import ImageIcon from "~/icons/Image";

const ImageMenuItem = (): React.ReactElement => (
  <MenuItem decorator={<ImageIcon />}>Image</MenuItem>
);

export default ImageMenuItem;
