import React from "react";

import MenuItem from "../../../../../../../ui/src/components/menu-item";
import Gallery from "~/entities/gallery";
import ImageIcon from "../../../../../../../ui/src/icons/image";

import { use_insert_image } from "../../../../../hooks/use-insert-image";

const ImageMenuItem = (): React.ReactElement => {
  const [insert_image] = use_insert_image();
  return (
    <Gallery
      on_confirm={(image): void =>
        insert_image({
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
