import React from "react";

import Input from "~/components/input";
import LetterXIcon from "~/icons/letter-x";
import LetterYIcon from "~/icons/letter-y";

import { use_active_object, use_event_render } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

const Position = (): React.ReactElement | null => {
  const active_object = use_active_object();
  const [pos, set_pos] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  });

  use_event_render("object:moving", (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });
  use_event_render("draw:scaling" as any, (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });
  use_event_render("draw:end" as any, (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });
  use_event_render("linear:moving" as any, (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });

  /**
   * Mutates X coordinate of the object
   * @param next_x New X coordinate
   */
  const change_x = React.useCallback(
    (next_x: number) => {
      if (active_object) {
        set_pos((prev_state) => ({ ...prev_state, x: next_x }));
        modify_object(active_object, {
          left: next_x
        });
      }
    },
    [active_object]
  );

  /**
   * Mutates Y coordinate of the object
   * @param next_y New Y coordinate
   */
  const change_y = React.useCallback(
    (next_y: number) => {
      if (active_object) {
        set_pos((prev_state) => ({ ...prev_state, y: next_y }));
        modify_object(active_object, {
          top: next_y
        });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    set_pos({
      x: active_object?.left || 0,
      y: active_object?.top || 0
    });
  }, [active_object?.left, active_object?.top]);

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")}>
      <DrawItemRow>
        <Input
          aria-label={"Position X"}
          decorator={<LetterXIcon />}
          monospaced
          onChange={(event): void =>
            change_x(Number.parseInt(event.target.value, 10) || 1)
          }
          placeholder={"Position X"}
          size={"sm"}
          title={"Position X"}
          type={"number"}
          value={Math.round(pos.x)}
        />
        <Input
          aria-label={"Position Y"}
          decorator={<LetterYIcon />}
          monospaced
          onChange={(event): void =>
            change_y(Number.parseInt(event.target.value, 10) || 1)
          }
          placeholder={"Position Y"}
          size={"sm"}
          title={"Position Y"}
          type={"number"}
          value={Math.round(pos.y)}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Position;
