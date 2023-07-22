"use client";

import React from "react";

import Input from "~/components/Input";
import ColorPicker, { strToColor } from "~/entities/ColorPicker";
import LetterHIcon from "~/icons/LetterH";
import LetterWIcon from "~/icons/LetterW";
import LetterXIcon from "~/icons/LetterX";
import LetterYIcon from "~/icons/LetterY";
import { clamp } from "~/utils/clamp";

import {
  MAX_LAYER_SIZE,
  MAX_ROTATION,
  MIN_LAYER_SIZE,
  MIN_ROTATION
} from "../../../constants";
import {
  mutateLayer,
  selectActiveLayerPosition,
  selectActiveLayerRotation,
  selectActiveLayers,
  selectActiveLayerSize,
  useEditorDispatch,
  useEditorSelector
} from "../../../store";

const Fill = (): React.ReactElement | null => {
  const dispatch = useEditorDispatch();
  const [layer] = useEditorSelector(selectActiveLayers);

  if (!layer) {
    return null;
  }

  return (
    <ColorPicker
      defaultValue={strToColor(layer.fill || undefined)}
      onChange={(value): void => {
        dispatch(mutateLayer({ id: layer.id, fill: value.str }));
      }}
    >
      <button>Fill</button>
    </ColorPicker>
  );
};

const Position = (): React.ReactElement | null => {
  const position = useEditorSelector(selectActiveLayerPosition);
  const disptach = useEditorDispatch();

  if (!position) {
    return null;
  }

  return (
    <div className={"flex"} style={{ padding: "4px 8px", gap: "8px" }}>
      <Input
        aria-label={"Position X"}
        decorator={<LetterXIcon />}
        onChange={(event): void => {
          disptach(
            mutateLayer({
              id: position.id,
              x: Number.parseInt(event.target.value, 10) || 1
            })
          );
        }}
        placeholder={"Position X"}
        size={"sm"}
        type={"number"}
        value={Math.round(position.x)}
      />
      <Input
        aria-label={"Position Y"}
        decorator={<LetterYIcon />}
        onChange={(event): void => {
          disptach(
            mutateLayer({
              id: position.id,
              y: Number.parseInt(event.target.value, 10) || 1
            })
          );
        }}
        placeholder={"Position Y"}
        size={"sm"}
        type={"number"}
        value={Math.round(position.y)}
      />
    </div>
  );
};

const Dimensions = (): React.ReactElement | null => {
  const dimensions = useEditorSelector(selectActiveLayerSize);
  const disptach = useEditorDispatch();

  if (!dimensions) {
    return null;
  }

  return (
    <div className={"flex"} style={{ padding: "4px 8px", gap: "8px" }}>
      <Input
        aria-label={"Layer width"}
        decorator={<LetterWIcon />}
        max={MAX_LAYER_SIZE}
        min={MIN_LAYER_SIZE}
        onChange={(event): void => {
          const value = Number.parseInt(event.target.value, 10) || 1;
          disptach(
            mutateLayer({
              id: dimensions.id,
              scaleX: value / 100
            })
          );
        }}
        placeholder={"Width"}
        size={"sm"}
        type={"number"}
        value={Math.round(dimensions.width * dimensions.scaleX)}
      />
      <Input
        aria-label={"Layer height"}
        decorator={<LetterHIcon />}
        max={MAX_LAYER_SIZE}
        min={MIN_LAYER_SIZE}
        onChange={(event): void => {
          const value = Number.parseInt(event.target.value, 10) || 1;
          disptach(
            mutateLayer({
              id: dimensions.id,
              scaleY: value / 100
            })
          );
        }}
        placeholder={"Height"}
        size={"sm"}
        type={"number"}
        value={Math.round(dimensions.height * dimensions.scaleY)}
      />
    </div>
  );
};

const ObjectProps = (): React.ReactElement | null => {
  const rotation = useEditorSelector(selectActiveLayerRotation);
  const disptach = useEditorDispatch();

  if (!rotation) {
    return null;
  }

  return (
    <div className={"flex"} style={{ padding: "4px 8px", gap: "8px" }}>
      <Input
        aria-label={"Layer width"}
        decorator={<LetterWIcon />}
        max={MAX_ROTATION}
        min={MIN_ROTATION}
        onChange={(event): void => {
          const value = Number.parseInt(event.target.value, 10) ?? 0;
          disptach(
            mutateLayer({
              id: rotation.id,
              rotation: clamp(MIN_ROTATION, value, MAX_ROTATION)
            })
          );
        }}
        placeholder={"Width"}
        size={"sm"}
        type={"number"}
        value={rotation.rotation}
      />
    </div>
  );
};

const DrawTools = (): React.ReactElement => (
  <>
    <Position />
    <Dimensions />
    <ObjectProps />
    <Fill />
  </>
);

export default DrawTools;
