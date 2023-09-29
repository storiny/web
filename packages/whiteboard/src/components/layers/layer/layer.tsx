import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Grow from "../../../../../ui/src/components/grow";
import IconButton from "../../../../../ui/src/components/icon-button";
import Input from "../../../../../ui/src/components/input";
import ArrowIcon from "~/icons/Arrow";
import CircleIcon from "~/icons/Circle";
import DiamondIcon from "~/icons/Diamond";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import GripIcon from "~/icons/Grip";
import ImageIcon from "~/icons/Image";
import LineIcon from "~/icons/Line";
import LockOpenIcon from "~/icons/LockOpen";
import PencilIcon from "~/icons/Pencil";
import RectangleIcon from "~/icons/Rectangle";
import TrashIcon from "~/icons/Trash";
import TypographyIcon from "~/icons/Typography";
import { capitalize } from "~/utils/capitalize";
import { truncate } from "~/utils/truncate";

import { isLayersDraggingAtom } from "../../../atoms";
import { LayerType } from "../../../constants";
import { useCanvas, useEventRender } from "../../../hooks";
import { modifyObject } from "../../../utils";
import { LayersContext } from "../layers-context";
import styles from "./layer.module.scss";
import { LayerProps } from "./layer.props";

const layerTypeToIconMap: Record<LayerType, React.ReactNode> = {
  [LayerType.IMAGE /*    */]: <ImageIcon />,
  [LayerType.ARROW /*    */]: <ArrowIcon rotation={45} />,
  [LayerType.ELLIPSE /*  */]: <CircleIcon />,
  [LayerType.RECTANGLE /**/]: <RectangleIcon />,
  [LayerType.TEXT /*     */]: <TypographyIcon />,
  [LayerType.LINE /*     */]: <LineIcon rotation={45} />,
  [LayerType.PEN /*      */]: <PencilIcon />,
  [LayerType.DIAMOND /*  */]: <DiamondIcon />
};

// Lock filled ico

const LockFilledIcon = (): React.ReactElement => (
  <svg
    aria-hidden={"true"}
    className={clsx(styles.x, styles["lock-icon"])}
    viewBox="0 0 12 12"
  >
    <path
      className={clsx(styles.x, styles.fill)}
      d="M2.8 5.8a1 1 0 0 0-.3.7v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5a1 1 0 0 0-.7.3Z"
    />
    <path
      className={clsx(styles.x, styles.stroke)}
      d="M3.5 5.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1m-5 0h5m-5 0H4m4.5 0H8m-4 0v-2a2 2 0 1 1 4 0v2m-4 0h4"
    />
  </svg>
);

const Layer = React.forwardRef<HTMLLIElement, LayerProps>((props, ref) => {
  const { layer, draggerProps, className, ...rest } = props;
  const canvas = useCanvas();
  const { layerCount } = React.useContext(LayersContext);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>(layer.get("name"));
  const isDragging = use_atom_value(isLayersDraggingAtom);
  useEventRender(
    "object:modified",
    (options) => options.target.get("id") === layer.get("id")
  );

  if (!layer) {
    return null;
  }

  /**
   * Selects the current layer
   */
  const selectLayerImpl = (): void => {
    if (canvas.current) {
      canvas.current.setActiveObject(layer as any);
      canvas.current.requestRenderAll();
    }
  };

  /**
   * Sets layer name
   * @param shouldSave Whether to save the new name to the store
   */
  const setLayerNameImpl = (shouldSave: boolean): void => {
    setIsEditing(false);

    if (shouldSave) {
      modifyObject(layer, {
        name
      });
    } else {
      setName(layer.get("name"));
    }
  };

  /**
   * Toggles the layer's lock
   */
  const toggleLayerLock = (): void => {
    modifyObject(layer, {
      locked: !layer.get("locked")
    });
  };

  /**
   * Toggles the layer's visibility
   */
  const toggleLayerVisibility = (): void => {
    modifyObject(layer, {
      visible: !layer.visible
    });
  };

  /**
   * Removes the current layer
   */
  const removeLayer = (): void => {
    canvas.current.remove(layer as any);
  };

  return (
    <li
      {...rest}
      className={clsx(
        "flex-center",
        "focusable",
        "focus-invert",
        styles.x,
        styles.layer,
        isDragging && styles.dragging,
        layer.get("selected") && styles.selected,
        !layer.visible && styles.hidden,
        className
      )}
      onClick={selectLayerImpl}
      onKeyUp={(event): void => {
        if (isEditing) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectLayerImpl();
        } else if (event.key === "Delete") {
          event.preventDefault();
          removeLayer();
        }
      }}
      ref={ref}
      role={"button"}
      tabIndex={0}
    >
      {!isEditing && !layer.get("locked") && layerCount > 1 ? (
        <IconButton
          {...draggerProps}
          aria-label={"Reorder layer"}
          className={clsx(styles.x, styles.grabber, draggerProps?.className)}
          size={"sm"}
          title={"Reorder layer"}
          variant={"ghost"}
        >
          <GripIcon />
        </IconButton>
      ) : null}
      <span
        className={clsx("flex-center", styles.x, styles.icon)}
        title={capitalize(layer.get("_type").replace(/-/g, " "))}
      >
        {layerTypeToIconMap[layer.get("_type") as LayerType]}
        {layer.get("selected") && (
          <svg
            aria-hidden
            className={clsx(styles.x, styles["selected-border"])}
            viewBox={"0 0 24 24"}
          >
            <rect
              fill="none"
              height="100%"
              stroke="var(--inverted-400)"
              strokeDasharray="12, 12"
              strokeDashoffset="6"
              strokeLinecap="square"
              strokeWidth="3"
              width="100%"
            />
          </svg>
        )}
      </span>
      {isEditing ? (
        <Input
          autoFocus
          onBlur={(): void => setLayerNameImpl(true)} // Stop editing when the input focus is lost
          onChange={(event): void => setName(truncate(event.target.value, 96))}
          onFocus={(event): void => event.target.select()}
          onKeyUp={(event): void => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              setLayerNameImpl(true);
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setLayerNameImpl(false);
            }
          }}
          placeholder={"Layer name"}
          size={"sm"}
          slot_props={{
            container: {
              className: clsx(styles.x, styles.input)
            }
          }}
          value={name}
        />
      ) : (
        <span
          className={clsx(
            "t-major",
            "t-medium",
            "ellipsis",
            styles.x,
            styles.label,
            layer.get("selected") && styles.selected
          )}
          title={name}
        >
          {layer.get("name")}
        </span>
      )}
      <Grow />
      {!isEditing && (
        <div className={"flex-center"} tabIndex={-1}>
          <IconButton
            aria-label={"Edit layer name"}
            className={clsx("focus-invert", styles.x, styles["button"])}
            onClick={(event): void => {
              event.stopPropagation();
              setIsEditing(true);
            }}
            size={"sm"}
            title={"Edit layer name"}
            variant={"ghost"}
          >
            <PencilIcon />
          </IconButton>
          <IconButton
            aria-label={`${layer.get("locked") ? "Unlock" : "Lock"} layer`}
            className={clsx(
              "focus-invert",
              styles.x,
              styles["button"],
              layer.get("locked") && styles.pinned
            )}
            onClick={(event): void => {
              event.stopPropagation();
              toggleLayerLock();
            }}
            size={"sm"}
            title={`${layer.get("locked") ? "Unlock" : "Lock"} layer`}
            variant={"ghost"}
          >
            {layer.get("locked") ? <LockFilledIcon /> : <LockOpenIcon />}
          </IconButton>
          <IconButton
            aria-label={`${!layer.visible ? "Show" : "Hide"} layer`}
            className={clsx(
              "focus-invert",
              styles.x,
              styles["button"],
              !layer.visible && styles.pinned
            )}
            onClick={(event): void => {
              event.stopPropagation();
              toggleLayerVisibility();
            }}
            size={"sm"}
            title={`${!layer.visible ? "Show" : "Hide"} layer`}
            variant={"ghost"}
          >
            {!layer.visible ? <EyeClosedIcon /> : <EyeIcon />}
          </IconButton>
          <IconButton
            aria-label={"Remove layer"}
            className={clsx("focus-invert", styles.x, styles["button"])}
            onClick={(event): void => {
              event.stopPropagation();
              removeLayer();
            }}
            size={"sm"}
            style={
              {
                "--icon-stroke": "var(--ruby-600)"
              } as React.CSSProperties
            }
            title={"Remove layer"}
            variant={"ghost"}
          >
            <TrashIcon />
          </IconButton>
        </div>
      )}
    </li>
  );
});

Layer.displayName = "Layer";

export default Layer;
