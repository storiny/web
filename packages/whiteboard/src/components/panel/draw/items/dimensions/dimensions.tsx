import React from "react";

import Input from "~/components/Input";
import Toggle from "~/components/Toggle";
import ConstrainedIcon from "~/icons/Constrained";
import LetterHIcon from "~/icons/LetterH";
import LetterWIcon from "~/icons/LetterW";
import UnconstrainedIcon from "~/icons/Unconstrained";
import { clamp } from "~/utils/clamp";

import { MAX_LAYER_SIZE, MIN_LAYER_SIZE } from "../../../../../constants";
import {
  useActiveObject,
  useCanvas,
  useEventRender
} from "../../../../../hooks";
import { isScalableObject, modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

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
  useEventRender("draw:scaling" as any, (options) => {
    const object = options.target;
    return object.get("id") === activeObject?.get("id");
  });
  useEventRender("draw:end" as any, (options) => {
    const object = options.target;
    return object.get("id") === activeObject?.get("id");
  });
  useEventRender("linear:moving" as any, (options) => {
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
        const clampedHeight = clamp(1, newHeight, Infinity);

        if (isScalableObject(activeObject)) {
          if (constrained) {
            activeObject.scaleToHeight(clampedHeight); // Scale both X and Y equally
            canvas.current?.requestRenderAll();
          } else {
            const boundingRectFactor =
              activeObject.getBoundingRect().height /
              activeObject.getScaledHeight();

            modifyObject(activeObject, {
              scaleY: clampedHeight / activeObject.height / boundingRectFactor
            });
          }
        } else {
          const delta = newHeight - activeObject.height;

          modifyObject(activeObject, {
            height: clampedHeight
          });

          if (constrained) {
            modifyObject(activeObject, {
              width: clamp(1, activeObject.width + delta, Infinity)
            });
          }
        }
      }
    },
    [activeObject, canvas, constrained]
  );

  /**
   * Mutates the width of the object
   */
  const changeWidth = React.useCallback(
    (newWidth: number) => {
      setDimensions((prevState) => ({ ...prevState, width: newWidth }));

      if (activeObject) {
        const clampedWidth = clamp(1, newWidth, Infinity);

        if (isScalableObject(activeObject)) {
          if (constrained) {
            activeObject.scaleToWidth(clampedWidth); // Scale both X and Y equally
            canvas.current?.requestRenderAll();
          } else {
            const boundingRectFactor =
              activeObject.getBoundingRect().width /
              activeObject.getScaledWidth();

            modifyObject(activeObject, {
              scaleX: clampedWidth / activeObject.width / boundingRectFactor
            });
          }
        } else {
          const delta = newWidth - activeObject.width;

          modifyObject(activeObject, {
            width: clampedWidth
          });

          if (constrained) {
            modifyObject(activeObject, {
              height: clamp(1, activeObject.height + delta, Infinity)
            });
          }
        }
      }
    },
    [activeObject, canvas, constrained]
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
      height: (activeObject?.height || 0) * (activeObject?.scaleY || 0) || 1,
      width: (activeObject?.width || 0) * (activeObject?.scaleX || 0) || 1
    });
  }, [
    activeObject?.height,
    activeObject?.scaleX,
    activeObject?.scaleY,
    activeObject?.width
  ]);

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem key={activeObject.get("id")}>
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
