import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import ArrowIcon from "~/icons/Arrow";
import CircleIcon from "~/icons/Circle";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import GripIcon from "~/icons/Grip";
import ImageIcon from "~/icons/Image";
import LineIcon from "~/icons/Line";
import LockOpenIcon from "~/icons/LockOpen";
import PencilIcon from "~/icons/Pencil";
import PolygonIcon from "~/icons/Polygon";
import RectangleIcon from "~/icons/Rectangle";
import TrashIcon from "~/icons/Trash";
import TypographyIcon from "~/icons/Typography";
import { capitalize } from "~/utils/capitalize";

import { LayerType } from "../../../constants";
import {
  removeLayer,
  selectActiveLayerId,
  setActiveLayer,
  setLayerName,
  toggleLayerLock,
  toggleLayerVisibility,
  useEditorDispatch,
  useEditorSelector
} from "../../../store";
import styles from "./Layer.module.scss";
import { LayerProps } from "./Layer.props";

const layerTypeToIconMap: Record<LayerType, React.ReactNode> = {
  [LayerType.MAIN_IMAGE]: <ImageIcon />,
  [LayerType.IMAGE]: <ImageIcon />,
  [LayerType.ARROW]: <ArrowIcon rotation={45} />,
  [LayerType.ELLIPSE]: <CircleIcon />,
  [LayerType.RECTANGLE]: <RectangleIcon />,
  [LayerType.TEXT]: <TypographyIcon />,
  [LayerType.LINE]: <LineIcon rotation={45} />,
  [LayerType.POLYGON]: <PolygonIcon />
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

const Layer = (props: LayerProps): React.ReactElement => {
  const { layer } = props;
  const dispatch = useEditorDispatch();
  const selectedLayerId = useEditorSelector(selectActiveLayerId);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>(layer.name);
  const isSelected = layer.id === selectedLayerId;

  /**
   * Selects the current layer
   */
  const selectLayer = (): void => {
    dispatch(setActiveLayer(layer.id));
  };

  /**
   * Sets layer name
   */
  const setLayerNameImpl = (): void => {
    dispatch(setLayerName({ name, id: layer.id }));
    setIsEditing(false);
  };

  return (
    <li
      className={clsx(
        "flex-center",
        "focusable",
        "focus-invert",
        styles.x,
        styles.layer,
        isSelected && styles.selected
      )}
      onClick={selectLayer}
      onKeyUp={(event): void => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectLayer();
        }
      }}
      role={"button"}
      tabIndex={0}
    >
      {!isEditing && (
        <IconButton
          aria-label={"Reorder layer"}
          className={clsx(styles.x, styles.grabber)}
          size={"sm"}
          title={"Reorder layer"}
          variant={"ghost"}
        >
          <GripIcon />
        </IconButton>
      )}
      <span
        className={clsx("flex-center", styles.x, styles.icon)}
        title={capitalize(layer.type.replace(/-/g, " "))}
      >
        {layerTypeToIconMap[layer.type]}
        {isSelected && (
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
          onBlur={setLayerNameImpl} // Stop editing when the input focus is lost
          onChange={(event): void => setName(event.target.value)}
          onKeyUp={(event): void => {
            if (event.key === "Enter") {
              event.preventDefault();
              setLayerNameImpl();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setLayerNameImpl();
            }
          }}
          placeholder={"Layer name"}
          size={"sm"}
          slotProps={{
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
            isSelected && styles.selected
          )}
          title={name}
        >
          {layer.name}
        </span>
      )}
      <Grow />
      {!isEditing && (
        <div className={"flex-center"}>
          <IconButton
            aria-label={"Edit layer name"}
            className={clsx(styles.x, styles["button"])}
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
            aria-label={`${layer.locked ? "Unlock" : "Lock"} layer`}
            className={clsx(styles.x, styles["button"])}
            onClick={(event): void => {
              event.stopPropagation();
              dispatch(toggleLayerLock(layer.id));
            }}
            size={"sm"}
            title={`${layer.locked ? "Unlock" : "Lock"} layer`}
            variant={"ghost"}
          >
            {layer.locked ? <LockFilledIcon /> : <LockOpenIcon />}
          </IconButton>
          <IconButton
            aria-label={`${layer.hidden ? "Show" : "Hide"} layer`}
            className={clsx(styles.x, styles["button"])}
            onClick={(event): void => {
              event.stopPropagation();
              dispatch(toggleLayerVisibility(layer.id));
            }}
            size={"sm"}
            title={`${layer.hidden ? "Show" : "Hide"} layer`}
            variant={"ghost"}
          >
            {layer.hidden ? <EyeClosedIcon /> : <EyeIcon />}
          </IconButton>
          {layer.type !== LayerType.MAIN_IMAGE && (
            <IconButton
              aria-label={"Remove layer"}
              className={clsx(styles.x, styles["button"])}
              onClick={(event): void => {
                event.stopPropagation();
                dispatch(removeLayer(layer.id));
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
          )}
        </div>
      )}
    </li>
  );
};

export default Layer;
