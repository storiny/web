import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Image from "src/components/image";
import PhotoIcon from "~/icons/Photo";

import { selected_atom } from "../../atoms";
import styles from "./preview.module.scss";

const ImagePreview = (): React.ReactElement => {
  const selected = use_atom_value(selected_atom);
  return (
    <div className={clsx("flex-center", styles.preview)}>
      {selected ? (
        <Image
          alt={""}
          className={styles.image}
          hex={selected.hex}
          slot_props={{
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
