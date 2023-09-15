import { AssetRating } from "@storiny/shared";
import React from "react";

import Gallery from "~/entities/gallery";
import ImageIcon from "~/icons/Image";

import { useInsertImage } from "../../../../../../hooks/use-insert-image";
import InsertItem from "../insert-item";

const isTest = process.env.NODE_ENV === "test";

const ImageItem = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [insertImage] = useInsertImage();
  return isTest ? (
    <button
      data-testid={"insert-image"}
      onClick={(): void =>
        insertImage({
          images: [
            {
              alt: "",
              key: "",
              hex: "",
              rating: AssetRating.NOT_RATED,
              width: 0,
              height: 0
            }
          ],
          credits: {
            url: "https://example.com",
            author: "some author"
          }
        })
      }
    >
      Image
    </button>
  ) : (
    <Gallery
      onConfirm={(image): void =>
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
        decorator={<ImageIcon />}
        disabled={disabled}
        label={"Image"}
      />
    </Gallery>
  );
};

export default ImageItem;
