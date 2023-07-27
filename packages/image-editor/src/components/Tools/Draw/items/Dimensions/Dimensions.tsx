import React from "react";

import Input from "~/components/Input";
import Toggle from "~/components/Toggle";
import ConstrainedIcon from "~/icons/Constrained";
import LetterHIcon from "~/icons/LetterH";
import LetterWIcon from "~/icons/LetterW";
import UnconstrainedIcon from "~/icons/Unconstrained";
import { clamp } from "~/utils/clamp";

import { MAX_LAYER_SIZE, MIN_LAYER_SIZE } from "../../../../../constants";
import { useCanvas } from "../../../../../hooks";
import { useActiveObject, useEventRender } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

const Dimensions = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const canvas = useCanvas();
  const [constrained, setConstrained] = React.useState<boolean>(
    Boolean(canvas.current?.uniformScaling)
  );
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
   */
  const changeHeight = React.useCallback(
    (newHeight: number) => {
      setDimensions((prevState) => ({ ...prevState, height: newHeight }));

      if (activeObject) {
        const delta = newHeight - activeObject.height;

        activeObject.set({
          height: clamp(1, newHeight, Infinity),
          scaleX: 1,
          scaleY: 1,
          dirty: true
        });

        if (constrained) {
          activeObject.set({
            width: clamp(1, activeObject.width + delta, Infinity)
          });
        }

        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject, constrained]
  );

  /**
   * Mutates the width of the object
   */
  const changeWidth = React.useCallback(
    (newWidth: number) => {
      setDimensions((prevState) => ({ ...prevState, width: newWidth }));

      if (activeObject) {
        const delta = newWidth - activeObject.width;

        activeObject.set({
          width: clamp(1, newWidth, Infinity),
          scaleX: 1,
          scaleY: 1,
          dirty: true
        });

        if (constrained) {
          activeObject.set({
            height: clamp(1, activeObject.height + delta, Infinity)
          });
        }

        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject, constrained]
  );

  /**
   * Mutates the constrained dimensions of the object
   */
  const changeConstrained = React.useCallback(
    (newConstrained: boolean) => {
      setConstrained(newConstrained);

      if (canvas.current) {
        canvas.current.uniformScaling = newConstrained;
      }
    },
    [canvas]
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
        <Toggle
          onPressedChange={changeConstrained}
          pressed={constrained}
          size={"sm"}
          style={{ "--size": "24px" } as React.CSSProperties}
          tooltipContent={`${
            constrained ? "Unconstrain" : "Constrain"
          } dimensions`}
        >
          {constrained ? <ConstrainedIcon /> : <UnconstrainedIcon />}
        </Toggle>
      </DrawItemRow>
    </DrawItem>
  );
};

export default Dimensions;
