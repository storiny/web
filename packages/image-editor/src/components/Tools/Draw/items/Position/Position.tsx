import React from "react";

import Input from "~/components/Input";
import LetterXIcon from "~/icons/LetterX";
import LetterYIcon from "~/icons/LetterY";

import { useActiveObject, useEventRender } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

const Position = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const [pos, setPos] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  });
  useEventRender("object:moving", (options) => {
    const object = options.target;
    return object.get("id") === activeObject?.get("id");
  });

  React.useEffect(() => {
    setPos({
      x: activeObject?.left || 0,
      y: activeObject?.top || 0
    });
  }, [activeObject?.left, activeObject?.top]);

  if (!activeObject) {
    return null;
  }

  /**
   * Mutates X coordinate of the object
   * @param newX New X coordinate
   */
  const changeX = (newX: number): void => {
    if (activeObject) {
      setPos((prevState) => ({ ...prevState, x: newX }));
      activeObject.set({
        left: newX
      });
      activeObject.canvas?.renderAll();
    }
  };

  /**
   * Mutates Y coordinate of the object
   * @param newY New Y coordinate
   */
  const changeY = (newY: number): void => {
    if (activeObject) {
      setPos((prevState) => ({ ...prevState, y: newY }));
      activeObject.set({
        top: newY
      });
      activeObject.canvas?.renderAll();
    }
  };

  return (
    <DrawItem>
      <DrawItemRow>
        <Input
          aria-label={"Position X"}
          decorator={<LetterXIcon />}
          monospaced
          onChange={(event): void =>
            changeX(Number.parseInt(event.target.value, 10) || 1)
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
            changeY(Number.parseInt(event.target.value, 10) || 1)
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
