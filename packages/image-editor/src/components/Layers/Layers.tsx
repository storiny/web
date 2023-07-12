import clsx from "clsx";
import React from "react";

import { selectLayers, useEditorSelector } from "../../store";
import Layer from "./Layer";
import styles from "./Layers.module.scss";
import { LayersProps } from "./Layers.props";

const Layers = (props: LayersProps): React.ReactElement => {
  const { scrollable } = props;
  const layers = useEditorSelector(selectLayers);

  return (
    <ul
      className={clsx(
        "flex-col",
        styles.layers,
        scrollable && styles.scrollable
      )}
    >
      {layers.map((layer) => (
        <Layer key={layer.id} layer={layer} />
      ))}
    </ul>
  );
};

export default Layers;
