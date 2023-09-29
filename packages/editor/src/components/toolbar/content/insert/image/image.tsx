import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import Gallery from "~/entities/gallery";
import ImageIcon from "~/icons/Image";

import { useInsertImage } from "../../../../../hooks/use-insert-image";

const ImageMenuItem = (): React.ReactElement => {
  const [insertImage] = useInsertImage();
  return (
    <Gallery
      on_confirm={(image): void =>
        insertImage({
          images: [
            {
              alt: image.alt,
              key: image.key,
              hex: image.hex,
              rating: image.rating,
              width: image.width,
              height: image.height
            }
          ],
          credits: image.credits
        })
      }
    >
      <MenuItem
        decorator={<ImageIcon />}
        onSelect={(event): void => event.preventDefault()}
      >
        Image
      </MenuItem>
    </Gallery>
  );
};

export default ImageMenuItem;
