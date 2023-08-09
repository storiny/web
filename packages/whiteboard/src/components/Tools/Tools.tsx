import clsx from "clsx";
import { useAtom, useSetAtom } from "jotai";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useFilePicker } from "use-file-picker";

import ScrollArea from "~/components/ScrollArea";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import { useToast } from "~/components/Toast";
import Tooltip, { TooltipProps } from "~/components/Tooltip";
import ArrowIcon from "~/icons/Arrow";
import CircleIcon from "~/icons/Circle";
import DiamondIcon from "~/icons/Diamond";
import FiltersIcon from "~/icons/Filters";
import HandIcon from "~/icons/Hand";
import ImageIcon from "~/icons/Image";
import LineIcon from "~/icons/Line";
import PencilIcon from "~/icons/Pencil";
import RectangleIcon from "~/icons/Rectangle";
import SelectIcon from "~/icons/Select";
import TypographyIcon from "~/icons/Typography";
import { truncate } from "~/utils/truncate";

import { isPenModeAtom, toolAtom } from "../../atoms";
import {
  CURSORS,
  DEFAULT_LAYER_COLOR,
  DEFAULT_TOOL,
  DrawableLayerType,
  LayerType,
  Tool
} from "../../constants";
import { useCanvas } from "../../hooks";
import { Image, PenBrush } from "../../lib";
import styles from "./Tools.module.scss";
import { useShortcuts } from "./useShortcuts";

// Tooltip with right position

const PositionedTooltip = ({
  slotProps,
  children,
  content,
  shortcutKey,
  ...rest
}: TooltipProps & { shortcutKey?: string }): React.ReactElement => (
  <Tooltip
    {...rest}
    content={
      <span className={"flex-center"}>
        {content}
        {shortcutKey && (
          <React.Fragment>
            <Spacer />
            <span
              aria-label={`Shortcut: ${shortcutKey}`}
              className={clsx("t-muted", styles.x, styles["shortcut-key"])}
            >
              {shortcutKey}
            </span>
          </React.Fragment>
        )}
      </span>
    }
    slotProps={{
      ...slotProps,
      content: { ...slotProps?.content, side: "right" }
    }}
  >
    <span>{children}</span>
  </Tooltip>
);

// Shape tools

const ShapeTools = (): React.ReactElement => (
  <React.Fragment>
    <PositionedTooltip content={"Rectangle tool"} shortcutKey={"R"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Rectangle tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<RectangleIcon className={clsx(styles.x, styles.icon)} />}
        role={undefined}
        value={Tool.RECTANGLE}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Diamond tool"} shortcutKey={"D"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Diamond tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<DiamondIcon className={clsx(styles.x, styles.icon)} />}
        role={undefined}
        value={Tool.DIAMOND}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Ellipse tool"} shortcutKey={"O"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Ellipse tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<CircleIcon className={clsx(styles.x, styles.icon)} />}
        role={undefined}
        value={Tool.ELLIPSE}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Line tool"} shortcutKey={"L"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Line tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={
          <LineIcon className={clsx(styles.x, styles.icon)} rotation={45} />
        }
        role={undefined}
        value={Tool.LINE}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Arrow tool"} shortcutKey={"Shift+L"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Arrow tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={
          <ArrowIcon className={clsx(styles.x, styles.icon)} rotation={45} />
        }
        role={undefined}
        value={Tool.ARROW}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Text tool (available soon)"}>
      {/* TODO: Implement */}
      <Tab
        aria-controls={undefined}
        aria-label={"Text tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<TypographyIcon className={clsx(styles.x, styles.icon)} />}
        disabled
        role={undefined}
        value={Tool.TEXT}
      />
    </PositionedTooltip>
  </React.Fragment>
);

// Image tool

const ImageTool = (): React.ReactElement => {
  const canvas = useCanvas();
  const toast = useToast();
  const [openFileSelector] = useFilePicker({
    readAs: "DataURL",
    accept: "image/*",
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    onFilesRejected: () => {
      toast("Unable to import the image", "error");
    },
    onFilesSuccessfulySelected: ({ filesContent }) => {
      if (filesContent[0]) {
        const file = filesContent[0];
        Image.fromURL(file.content).then((loaded) => {
          if (canvas.current) {
            loaded.set({
              left: canvas.current.width / 2,
              top: canvas.current.height / 2,
              name: file.name ? truncate(file.name, 96) : undefined
            });

            canvas.current.add(loaded);
          }
        });
      } else {
        toast("No image selected", "error");
      }
    }
  });
  useHotkeys("i", () => openFileSelector());

  return (
    <PositionedTooltip content={"Image tool"} shortcutKey={"I"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Image tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<ImageIcon className={clsx(styles.x, styles.icon)} />}
        onClick={openFileSelector}
        role={undefined}
        value={Tool.IMAGE}
      />
    </PositionedTooltip>
  );
};

const Tools = (): React.ReactElement => {
  const canvas = useCanvas();
  // const activeObject = useActiveObject();
  const [tool, setTool] = useAtom(toolAtom);
  const setPenMode = useSetAtom(isPenModeAtom);
  // const isImageObjectActive = activeObject && isImageObject(activeObject);
  useShortcuts();

  /**
   * Toggles shape drawing mode
   */
  const toggleDrawMode = React.useCallback(
    (shape: DrawableLayerType | null): void => {
      if (canvas.current) {
        if (shape) {
          canvas.current.drawManager.setLayerType(shape);
          canvas.current.drawManager.setEnabled(true);
          canvas.current.drawManager.setDrawComplete(() =>
            setTool(DEFAULT_TOOL)
          );
        } else {
          canvas.current.drawManager.setEnabled(false);
        }
      }
    },
    [canvas, setTool]
  );

  /**
   * Toggles panning mode
   */
  const togglePanMode = React.useCallback(
    (enabled: boolean): void => {
      if (canvas.current) {
        canvas.current.panManager.setEnabled(enabled);
      }
    },
    [canvas]
  );

  /**
   * Toggles pen mode
   */
  const togglePenMode = React.useCallback(
    (enabled: boolean): void => {
      if (canvas.current) {
        if (enabled) {
          setPenMode(true);
          canvas.current.isDrawingMode = true;
          canvas.current.freeDrawingBrush = new PenBrush(canvas.current);
          canvas.current.freeDrawingBrush.color = DEFAULT_LAYER_COLOR;
          canvas.current.freeDrawingCursor = CURSORS.pen(DEFAULT_LAYER_COLOR);
        } else {
          setPenMode(false);
          canvas.current.isDrawingMode = false;
        }
      }
    },
    [canvas, setPenMode]
  );

  React.useEffect(() => {
    togglePenMode(tool === Tool.PEN);

    switch (tool) {
      case Tool.RECTANGLE:
        toggleDrawMode(LayerType.RECTANGLE);
        break;
      case Tool.DIAMOND:
        toggleDrawMode(LayerType.DIAMOND);
        break;
      case Tool.ELLIPSE:
        toggleDrawMode(LayerType.ELLIPSE);
        break;
      case Tool.LINE:
        toggleDrawMode(LayerType.LINE);
        break;
      case Tool.ARROW:
        toggleDrawMode(LayerType.ARROW);
        break;
      default:
        toggleDrawMode(null);
        break;
    }

    togglePanMode(tool === Tool.HAND);
  }, [toggleDrawMode, togglePanMode, togglePenMode, tool]);

  return (
    <ScrollArea
      className={clsx("fit-w", styles.x, styles.tools)}
      slotProps={{
        thumb: {
          className: clsx(styles.x, styles.thumb)
        },
        scrollbar: {
          style: { backgroundColor: "transparent", border: "none", zIndex: 1 }
        }
      }}
      type={"hover"}
    >
      <Tabs
        onValueChange={(newValue): void => {
          // Do not select image tool
          if (newValue !== Tool.IMAGE) {
            setTool(newValue as Tool);
          }
        }}
        orientation={"vertical"}
        role={undefined}
        value={tool}
      >
        <TabsList aria-orientation={undefined} loop={false} role={undefined}>
          <PositionedTooltip content={"Select tool"} shortcutKey={"V"}>
            <Tab
              aria-controls={undefined}
              aria-label={"Select tool"}
              className={clsx(styles.x, styles.tool)}
              decorator={<SelectIcon className={clsx(styles.x, styles.icon)} />}
              role={undefined}
              value={Tool.SELECT}
            />
          </PositionedTooltip>
          <PositionedTooltip content={"Hand tool"} shortcutKey={"H"}>
            <Tab
              aria-controls={undefined}
              aria-label={"Hand tool"}
              className={clsx(styles.x, styles.tool)}
              decorator={<HandIcon className={clsx(styles.x, styles.icon)} />}
              role={undefined}
              value={Tool.HAND}
            />
          </PositionedTooltip>
          <PositionedTooltip content={"Pen tool"} shortcutKey={"P"}>
            <Tab
              aria-controls={undefined}
              aria-label={"Pen tool"}
              className={clsx(styles.x, styles.tool)}
              decorator={<PencilIcon className={clsx(styles.x, styles.icon)} />}
              role={undefined}
              value={Tool.PEN}
            />
          </PositionedTooltip>
          <Separator />
          <ImageTool />
          <PositionedTooltip content={"Filters tool (available soon)"}>
            <Tab
              aria-controls={undefined}
              aria-label={"Filters tool"}
              className={clsx(styles.x, styles.tool)}
              decorator={
                <FiltersIcon className={clsx(styles.x, styles.icon)} />
              }
              // disabled={!isImageObjectActive}
              disabled
              role={undefined}
              value={Tool.FILTERS}
            />
          </PositionedTooltip>
          <Separator />
          <ShapeTools />
        </TabsList>
      </Tabs>
    </ScrollArea>
  );
};

export default Tools;
