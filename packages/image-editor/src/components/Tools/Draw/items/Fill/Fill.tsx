import React from "react";

import Input from "~/components/Input";
import ColorPicker, { strToColor, TColor } from "~/entities/ColorPicker";

import { DEFAULT_LAYER_FILL } from "../../../../../constants";
import { useActiveObject } from "../../../../../store";
import DrawItem from "../../Item";
import styles from "./Fill.module.scss";

const Fill = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const [fill, setFill] = React.useState<TColor>(
    strToColor((activeObject?.fill as string) || DEFAULT_LAYER_FILL)!
  );
  const [value, setValue] = React.useState(`#${fill.hex}`);

  React.useEffect(() => {
    setValue(`#${fill.hex}`);
  }, [fill]);

  if (!activeObject) {
    return null;
  }

  /**
   * Mutates the fill of the object
   * @param newFill New fill
   */
  const changeFill = (newFill: TColor): void => {
    setFill(newFill);

    if (activeObject) {
      activeObject.set({
        fill: newFill.str
      });
      activeObject.canvas?.renderAll();
    }
  };

  return (
    <DrawItem label={"Fill"}>
      <Input
        aria-label={"Layer fill"}
        decorator={
          <ColorPicker
            defaultValue={fill}
            onChange={(value): void => changeFill(value)}
          >
            <button
              aria-label={"Pick a color"}
              className={styles.indicator}
              style={
                {
                  "--fill": fill.str
                } as React.CSSProperties
              }
              title={"Pick a color"}
            />
          </ColorPicker>
        }
        monospaced
        onChange={(event): void => {
          setValue(event.target.value);
          const newColor = strToColor(event.target.value);

          if (newColor) {
            changeFill(newColor);
          }
        }}
        placeholder={"Fill"}
        size={"sm"}
        title={"Fill"}
        value={value}
      />
    </DrawItem>
  );
};

export default Fill;
