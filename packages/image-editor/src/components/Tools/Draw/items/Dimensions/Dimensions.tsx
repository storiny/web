import React from "react";

import Input from "~/components/Input";
import LetterHIcon from "~/icons/LetterH";
import LetterWIcon from "~/icons/LetterW";

import { MAX_LAYER_SIZE, MIN_LAYER_SIZE } from "../../../../../constants";
import {
  mutateLayer,
  selectActiveLayer,
  useEditorDispatch,
  useEditorSelector
} from "../../../../../store";
import DrawItem from "../../Item";

const Dimensions = (): React.ReactElement | null => {
  const activeLayer = useEditorSelector(selectActiveLayer);
  const dispatch = useEditorDispatch();

  if (!activeLayer) {
    return null;
  }

  /**
   * Mutates the scale X of the object
   * @param scaleX New scale X
   */
  const changeScaleX = (scaleX: number): void => {
    dispatch(mutateLayer({ id: activeLayer.id, scaleX }));
  };

  /**
   * Mutates the scale Y of the object
   * @param scaleY New scale Y
   */
  const changeScaleY = (scaleY: number): void => {
    dispatch(mutateLayer({ id: activeLayer.id, scaleY }));
  };

  return (
    <DrawItem>
      <Input
        aria-label={"Layer width"}
        decorator={<LetterWIcon />}
        max={MAX_LAYER_SIZE}
        min={MIN_LAYER_SIZE}
        monospaced
        onChange={(event): void =>
          changeScaleX((Number.parseFloat(event.target.value) || 1) / 100)
        }
        placeholder={"Width"}
        size={"sm"}
        title={"Width"}
        type={"number"}
        value={Math.round(activeLayer.width * activeLayer.scaleX)}
      />
      <Input
        aria-label={"Layer height"}
        decorator={<LetterHIcon />}
        max={MAX_LAYER_SIZE}
        min={MIN_LAYER_SIZE}
        monospaced
        onChange={(event): void =>
          changeScaleY((Number.parseFloat(event.target.value) || 1) / 100)
        }
        placeholder={"Height"}
        size={"sm"}
        title={"Height"}
        type={"number"}
        value={Math.round(activeLayer.height * activeLayer.scaleY)}
      />
    </DrawItem>
  );
};

export default Dimensions;
