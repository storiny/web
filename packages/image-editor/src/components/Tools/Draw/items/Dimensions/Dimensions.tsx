import React from "react";

import Input from "~/components/Input";
import LetterHIcon from "~/icons/LetterH";
import LetterWIcon from "~/icons/LetterW";

import { MAX_LAYER_SIZE, MIN_LAYER_SIZE } from "../../../../../constants";
import { useActiveObject, useEventRender } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

const Dimensions = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const [dimensions, setDimensions] = React.useState<{
    height: number;
    width: number;
  }>({
    height: 0,
    width: 0
  });
  useEventRender("object:scaling", (options) => {
    const object = options.target;
    return object.get("id") === activeObject?.get("id");
  });

  /**
   * Mutates the height of the object
   * @param newHeight New width
   */
  const changeHeight = React.useCallback(
    (newHeight: number) => {
      if (activeObject) {
        setDimensions((prevState) => ({ ...prevState, height: newHeight }));
        activeObject.set({
          height: newHeight,
          scaleX: 1,
          scaleY: 1,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  /**
   * Mutates the width of the object
   * @param newWidth New width
   */
  const changeWidth = React.useCallback(
    (newWidth: number) => {
      if (activeObject) {
        setDimensions((prevState) => ({ ...prevState, width: newWidth }));
        activeObject.set({
          width: newWidth,
          scaleX: 1,
          scaleY: 1,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setDimensions({
      height: activeObject?.height || 1,
      width: activeObject?.width || 1
    });
  }, [activeObject?.height, activeObject?.width]);

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem>
      <DrawItemRow>
        <Input
          aria-label={"Layer width"}
          decorator={<LetterWIcon />}
          max={MAX_LAYER_SIZE}
          min={MIN_LAYER_SIZE}
          monospaced
          onChange={(event): void =>
            changeWidth(Number.parseFloat(event.target.value) || 1)
          }
          placeholder={"Width"}
          size={"sm"}
          title={"Width"}
          type={"number"}
          value={Math.round(dimensions.width)}
        />
        <Input
          aria-label={"Layer height"}
          decorator={<LetterHIcon />}
          max={MAX_LAYER_SIZE}
          min={MIN_LAYER_SIZE}
          monospaced
          onChange={(event): void =>
            changeHeight(Number.parseFloat(event.target.value) || 1)
          }
          placeholder={"Height"}
          size={"sm"}
          title={"Height"}
          type={"number"}
          value={Math.round(dimensions.height)}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Dimensions;
