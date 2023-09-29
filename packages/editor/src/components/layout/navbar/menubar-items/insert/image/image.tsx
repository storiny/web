import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import Gallery from "~/entities/gallery";
import ImageIcon from "../../../../../../../../ui/src/icons/image";

import { use_insert_image } from "../../../../../../hooks/use-insert-image";

const ImageMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
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
      <MenubarItem
        decorator={<ImageIcon />}
        disabled={disabled}
        onSelect={(event): void => event.preventDefault()}
      >
        Image
      </MenubarItem>
    </Gallery>
  );
};

export default ImageMenubarItem;
