import React from "react";

import Input from "~/components/Input";
import AxisXIcon from "~/icons/AxisX";
import AxisYIcon from "~/icons/AxisY";

import { useActiveObject } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

const Skew = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  /**
   * Mutates the skew of the object
   */
  const changeSkew = React.useCallback(
    (skew: number, axis: "x" | "y") => {
      if (activeObject) {
        activeObject.set({
          [`skew${axis.toUpperCase()}`]: skew,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem>
      <DrawItemRow>
        <Input
          aria-label={"Layer skew X"}
          decorator={<AxisXIcon />}
          defaultValue={Math.round(activeObject.skewX)}
          monospaced
          onChange={(event): void =>
            changeSkew(Number.parseFloat(event.target.value) || 1, "x")
          }
          placeholder={"Skew X"}
          size={"sm"}
          title={"Skew X"}
          type={"number"}
        />
        <Input
          aria-label={"Layer skew Y"}
          decorator={<AxisYIcon />}
          defaultValue={Math.round(activeObject.skewY)}
          monospaced
          onChange={(event): void =>
            changeSkew(Number.parseFloat(event.target.value) || 1, "y")
          }
          placeholder={"Skew Y"}
          size={"sm"}
          title={"Skew Y"}
          type={"number"}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Skew;
