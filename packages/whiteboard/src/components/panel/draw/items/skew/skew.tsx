import React from "react";

import Input from "../../../../../../../ui/src/components/input";
import AxisXIcon from "~/icons/AxisX";
import AxisYIcon from "~/icons/AxisY";

import { useActiveObject } from "../../../../../hooks";
import { modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

const Skew = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  /**
   * Mutates the skew of the object
   */
  const changeSkew = React.useCallback(
    (skew: number, axis: "x" | "y") => {
      if (activeObject) {
        modifyObject(activeObject, {
          [`skew${axis.toUpperCase()}`]: skew
        });
      }
    },
    [activeObject]
  );

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem key={activeObject.get("id")}>
      <DrawItemRow>
        <Input
          aria-label={"Layer skew X"}
          decorator={<AxisXIcon />}
          defaultValue={Math.round(activeObject.skewX)}
          monospaced
          onChange={(event): void =>
            changeSkew(Number.parseFloat(event.target.value) || 0, "x")
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
            changeSkew(Number.parseFloat(event.target.value) || 0, "y")
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
