import React from "react";

import Gallery from "~/entities/gallery";
import ImageIcon from "~/icons/Image";

import { useInsertImage } from "../../../../../../../hooks/use-insert-image";
import InsertItem from "../insert-item";

const ImageItem = ({
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
      <InsertItem
        data-testid={"insert-image"}
        decorator={<ImageIcon />}
        disabled={disabled}
        label={"Image"}
      />
    </Gallery>
  );
};

export default ImageItem;
