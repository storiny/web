import clsx from "clsx";
import { useAtom as use_atom, useSetAtom as use_set_atom } from "jotai";
import React from "react";
import { useHotkeys as use_hot_keys } from "react-hotkeys-hook";
import { useFilePicker as use_file_picker } from "use-file-picker";

import ScrollArea from "~/components/scroll-area";
import Separator from "~/components/separator";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import { use_toast } from "~/components/toast";
import Tooltip, { TooltipProps } from "~/components/tooltip";
import ArrowIcon from "~/icons/arrow";
import CircleIcon from "~/icons/circle";
import DiamondIcon from "~/icons/diamond";
import FiltersIcon from "~/icons/filters";
import HandIcon from "~/icons/hand";
import ImageIcon from "~/icons/image";
import LineIcon from "~/icons/line";
import PencilIcon from "~/icons/pencil";
import RectangleIcon from "~/icons/rectangle";
import SelectIcon from "~/icons/select";
import TypographyIcon from "~/icons/typography";
import { truncate } from "~/utils/truncate";

import { is_pen_mode_atom, tool_atom } from "../../atoms";
import {
  CURSORS,
  DEFAULT_LAYER_COLOR,
  DEFAULT_TOOL,
  DrawableLayerType,
  LayerType,
  Tool
} from "../../constants";
import { use_canvas } from "../../hooks";
import { Image, PenBrush } from "../../lib";
import styles from "./tools.module.scss";
import { use_shortcuts } from "./use-shortcuts";

// Tooltip with right position

const PositionedTooltip = ({
  slot_props,
  children,
  shortcut_key,
  ...rest
}: TooltipProps & { shortcut_key?: string }): React.ReactElement => (
  <Tooltip
    {...rest}
    right_slot={shortcut_key}
    slot_props={{
      ...slot_props,
      content: { ...slot_props?.content, side: "right" }
    }}
  >
    <span>{children}</span>
  </Tooltip>
);

// Shape tools

const ShapeTools = (): React.ReactElement => (
  <React.Fragment>
    <PositionedTooltip content={"Rectangle tool"} shortcut_key={"R"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Rectangle tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<RectangleIcon className={clsx(styles.x, styles.icon)} />}
        role={undefined}
        value={Tool.RECTANGLE}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Diamond tool"} shortcut_key={"D"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Diamond tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<DiamondIcon className={clsx(styles.x, styles.icon)} />}
        role={undefined}
        value={Tool.DIAMOND}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Ellipse tool"} shortcut_key={"O"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Ellipse tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<CircleIcon className={clsx(styles.x, styles.icon)} />}
        role={undefined}
        value={Tool.ELLIPSE}
      />
    </PositionedTooltip>
    <PositionedTooltip content={"Line tool"} shortcut_key={"L"}>
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
    <PositionedTooltip content={"Arrow tool"} shortcut_key={"Shift+L"}>
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
  const canvas = use_canvas();
  const toast = use_toast();
  const [open_file_selector] = use_file_picker({
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    readAs: "DataURL",
    accept: "image/*",
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    /* eslint-enable prefer-snakecase/prefer-snakecase */
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onFilesRejected: () => {
      toast("Unable to import the image", "error");
    },
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onFilesSuccessfulySelected: ({ filesContent: files_content }) => {
      if (files_content[0]) {
        const file = files_content[0];
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
  use_hot_keys("i", () => open_file_selector());

  return (
    <PositionedTooltip content={"Image tool"} shortcut_key={"I"}>
      <Tab
        aria-controls={undefined}
        aria-label={"Image tool"}
        className={clsx(styles.x, styles.tool)}
        decorator={<ImageIcon className={clsx(styles.x, styles.icon)} />}
        onClick={open_file_selector}
        role={undefined}
        value={Tool.IMAGE}
      />
    </PositionedTooltip>
  );
};

const Tools = (): React.ReactElement => {
  const canvas = use_canvas();
  const [tool, set_tool] = use_atom(tool_atom);
  const set_pen_mode = use_set_atom(is_pen_mode_atom);
  use_shortcuts();

  /**
   * Toggles shape drawing mode
   */
  const toggle_draw_mode = React.useCallback(
    (shape: DrawableLayerType | null): void => {
      if (canvas.current) {
        if (shape) {
          canvas.current.draw_manager.set_layer_type(shape);
          canvas.current.draw_manager.set_enabled(true);
          canvas.current.draw_manager.set_draw_complete(() =>
            set_tool(DEFAULT_TOOL)
          );
        } else {
          canvas.current.draw_manager.set_enabled(false);
        }
      }
    },
    [canvas, set_tool]
  );

  /**
   * Toggles panning mode
   */
  const toggle_pan_mode = React.useCallback(
    (enabled: boolean): void => {
      if (canvas.current) {
        canvas.current.pan_manager.set_enabled(enabled);
      }
    },
    [canvas]
  );

  /**
   * Toggles pen mode
   */
  const toggle_pen_mode = React.useCallback(
    (enabled: boolean): void => {
      if (canvas.current) {
        if (enabled) {
          set_pen_mode(true);
          canvas.current.isDrawingMode = true;
          canvas.current.freeDrawingBrush = new PenBrush(canvas.current);
          canvas.current.freeDrawingBrush.color = DEFAULT_LAYER_COLOR;
          canvas.current.freeDrawingCursor = CURSORS.pen(DEFAULT_LAYER_COLOR);
        } else {
          set_pen_mode(false);
          canvas.current.isDrawingMode = false;
        }
      }
    },
    [canvas, set_pen_mode]
  );

  React.useEffect(() => {
    toggle_pen_mode(tool === Tool.PEN);

    switch (tool) {
      case Tool.RECTANGLE:
        toggle_draw_mode(LayerType.RECTANGLE);
        break;
      case Tool.DIAMOND:
        toggle_draw_mode(LayerType.DIAMOND);
        break;
      case Tool.ELLIPSE:
        toggle_draw_mode(LayerType.ELLIPSE);
        break;
      case Tool.LINE:
        toggle_draw_mode(LayerType.LINE);
        break;
      case Tool.ARROW:
        toggle_draw_mode(LayerType.ARROW);
        break;
      default:
        toggle_draw_mode(null);
        break;
    }

    toggle_pan_mode(tool === Tool.HAND);
  }, [toggle_draw_mode, toggle_pan_mode, toggle_pen_mode, tool]);

  return (
    <ScrollArea
      className={clsx("fit-w", styles.x, styles.tools)}
      slot_props={{
        thumb: {
          className: clsx(styles.x, styles.thumb)
        },
        scrollbar: {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          style: { backgroundColor: "transparent", border: "none", zIndex: 1 }
        }
      }}
      type={"hover"}
    >
      <Tabs
        onValueChange={(next_value): void => {
          // Do not select image tool
          if (next_value !== Tool.IMAGE) {
            set_tool(next_value as Tool);
          }
        }}
        orientation={"vertical"}
        role={undefined}
        value={tool}
      >
        <TabsList aria-orientation={undefined} loop={false} role={undefined}>
          <PositionedTooltip content={"Select tool"} shortcut_key={"V"}>
            <Tab
              aria-controls={undefined}
              aria-label={"Select tool"}
              className={clsx(styles.x, styles.tool)}
              decorator={<SelectIcon className={clsx(styles.x, styles.icon)} />}
              role={undefined}
              value={Tool.SELECT}
            />
          </PositionedTooltip>
          <PositionedTooltip content={"Hand tool"} shortcut_key={"H"}>
            <Tab
              aria-controls={undefined}
              aria-label={"Hand tool"}
              className={clsx(styles.x, styles.tool)}
              decorator={<HandIcon className={clsx(styles.x, styles.icon)} />}
              role={undefined}
              value={Tool.HAND}
            />
          </PositionedTooltip>
          <PositionedTooltip content={"Pen tool"} shortcut_key={"P"}>
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
