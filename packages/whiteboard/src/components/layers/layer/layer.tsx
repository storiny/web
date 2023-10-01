import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import ArrowIcon from "~/icons/arrow";
import CircleIcon from "~/icons/circle";
import DiamondIcon from "~/icons/diamond";
import EyeIcon from "~/icons/eye";
import EyeClosedIcon from "~/icons/eye-closed";
import GripIcon from "~/icons/grip";
import ImageIcon from "~/icons/image";
import LineIcon from "~/icons/line";
import LockOpenIcon from "~/icons/lock-open";
import PencilIcon from "~/icons/pencil";
import RectangleIcon from "~/icons/rectangle";
import TrashIcon from "~/icons/trash";
import TypographyIcon from "~/icons/typography";
import { capitalize } from "~/utils/capitalize";
import { truncate } from "~/utils/truncate";

import { is_layers_dragging_atom } from "../../../atoms";
import { LayerType } from "../../../constants";
import { use_canvas, use_event_render } from "../../../hooks";
import { modify_object } from "../../../utils";
import { LayersContext } from "../layers-context";
import styles from "./layer.module.scss";
import { LayerProps } from "./layer.props";

const LAYER_TYPE_ICON_MAP: Record<LayerType, React.ReactNode> = {
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
  const { layer, dragger_props, className, ...rest } = props;
  const canvas = use_canvas();
  const { layer_count } = React.useContext(LayersContext);
  const [is_editing, set_is_editing] = React.useState<boolean>(false);
  const [name, set_name] = React.useState<string>(layer.get("name"));
  const is_dragging = use_atom_value(is_layers_dragging_atom);
  use_event_render(
    "object:modified",
    (options) => options.target.get("id") === layer.get("id")
  );

  if (!layer) {
    return null;
  }

  /**
   * Selects the current layer
   */
  const select_layer_impl = (): void => {
    if (canvas.current) {
      canvas.current.setActiveObject(layer as any);
      canvas.current.requestRenderAll();
    }
  };

  /**
   * Sets layer name
   * @param should_save Whether to save the new name to the store
   */
  const set_layer_name_impl = (should_save: boolean): void => {
    set_is_editing(false);

    if (should_save) {
      modify_object(layer, {
        name
      });
    } else {
      set_name(layer.get("name"));
    }
  };

  /**
   * Toggles the layer's lock
   */
  const toggle_layer_lock = (): void => {
    modify_object(layer, {
      locked: !layer.get("locked")
    });
  };

  /**
   * Toggles the layer's visibility
   */
  const toggle_layer_visibility = (): void => {
    modify_object(layer, {
      visible: !layer.visible
    });
  };

  /**
   * Removes the current layer
   */
  const remove_layer = (): void => {
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
        is_dragging && styles.dragging,
        layer.get("selected") && styles.selected,
        !layer.visible && styles.hidden,
        className
      )}
      onClick={select_layer_impl}
      onKeyUp={(event): void => {
        if (is_editing) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select_layer_impl();
        } else if (event.key === "Delete") {
          event.preventDefault();
          remove_layer();
        }
      }}
      ref={ref}
      role={"button"}
      tabIndex={0}
    >
      {!is_editing && !layer.get("locked") && layer_count > 1 ? (
        <IconButton
          {...dragger_props}
          aria-label={"Reorder layer"}
          className={clsx(styles.x, styles.grabber, dragger_props?.className)}
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
        {LAYER_TYPE_ICON_MAP[layer.get("_type") as LayerType]}
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
      {is_editing ? (
        <Input
          autoFocus
          onBlur={(): void => set_layer_name_impl(true)} // Stop editing when the input focus is lost
          onChange={(event): void => set_name(truncate(event.target.value, 96))}
          onFocus={(event): void => event.target.select()}
          onKeyUp={(event): void => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              set_layer_name_impl(true);
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              set_layer_name_impl(false);
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
      {!is_editing && (
        <div className={"flex-center"} tabIndex={-1}>
          <IconButton
            aria-label={"Edit layer name"}
            className={clsx("focus-invert", styles.x, styles["button"])}
            onClick={(event): void => {
              event.stopPropagation();
              set_is_editing(true);
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
              toggle_layer_lock();
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
              toggle_layer_visibility();
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
              remove_layer();
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
