import React from "react";

import Input from "../../../../../../../ui/src/components/input";
import AxisXIcon from "../../../../../../../ui/src/icons/axis-x";
import AxisYIcon from "../../../../../../../ui/src/icons/axis-y";

import { use_active_object } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

const Skew = (): React.ReactElement | null => {
  const active_object = use_active_object();

  /**
   * Mutates the skew of the object
   */
  const change_skew = React.useCallback(
    (next_skew: number, axis: "x" | "y") => {
      if (active_object) {
        modify_object(active_object, {
          [`skew${axis.toUpperCase()}`]: next_skew
        });
      }
    },
    [active_object]
  );

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")}>
      <DrawItemRow>
        <Input
          aria-label={"Layer skew X"}
          decorator={<AxisXIcon />}
          defaultValue={Math.round(active_object.skewX)}
          monospaced
          onChange={(event): void =>
            change_skew(Number.parseFloat(event.target.value) || 0, "x")
          }
          placeholder={"Skew X"}
          size={"sm"}
          title={"Skew X"}
          type={"number"}
        />
        <Input
          aria-label={"Layer skew Y"}
          decorator={<AxisYIcon />}
          defaultValue={Math.round(active_object.skewY)}
          monospaced
          onChange={(event): void =>
            change_skew(Number.parseFloat(event.target.value) || 0, "y")
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
