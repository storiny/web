import React from "react";

import MenubarItem from "../../../../../../../../ui/src/components/menubar-item";
import Gallery from "~/entities/gallery";
import ImageIcon from "~/icons/Image";

import { useInsertImage } from "../../../../../../hooks/use-insert-image";

const ImageMenubarItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
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
