import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Image from "~/components/Image";
import PhotoIcon from "~/icons/Photo";

import { selectedAtom } from "../../atoms";
import styles from "./Preview.module.scss";

const ImagePreview = (): React.ReactElement => {
  const selected = useAtomValue(selectedAtom);
  return (
    <div className={clsx("flex-center", styles.preview)}>
      {selected ? (
        <Image
          alt={""}
          className={styles.image}
          hex={selected.hex}
          slotProps={{
            fallback: { style: { display: "none" } },
            image: styles["native-image"]
          }}
          src={selected.src}
        />
      ) : (
        <PhotoIcon />
      )}
    </div>
  );
};

export default ImagePreview;
