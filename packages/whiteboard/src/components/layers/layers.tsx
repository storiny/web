"use client";

import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DropResult
} from "@hello-pangea/dnd";
import clsx from "clsx";
import { BaseFabricObject } from "fabric";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";
import { Virtuoso } from "react-virtuoso";
import use_resize_observer from "use-resize-observer";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/scroll-area";

import { is_layers_dragging_atom } from "../../atoms";
import { use_canvas } from "../../hooks";
import Layer, { LayerSkeleton } from "./layer";
import styles from "./layers.module.scss";
import { LayersContext } from "./layers-context";

const LAYER_HEIGHT = 28;

// Layer item

const VirtualizedLayer = React.memo<
  {
    is_dragging: boolean;
    layer: BaseFabricObject;
    provided: DraggableProvided;
  } & React.ComponentPropsWithoutRef<"li">
>(({ layer, provided, is_dragging, ...rest }) => (
  <Layer
    {...rest}
    {...provided.draggableProps}
    data-dragging={String(is_dragging)}
    dragger_props={{
      ...provided.dragHandleProps
    }}
    layer={layer}
    ref={provided.innerRef}
    style={provided.draggableProps.style}
  />
));

VirtualizedLayer.displayName = "VirtualizedLayer";

// Scroller

const Scroller = React.memo(
  React.forwardRef<HTMLDivElement, React.ComponentPropsWithRef<"div">>(
    ({ children, ...rest }, ref) => {
      const { layer_count, panel_height } = React.useContext(LayersContext);
      const scroll_height = layer_count * LAYER_HEIGHT;
      const visible = scroll_height > panel_height;

      return (
        <>
          <Viewport
            {...rest}
            className={clsx(
              styles.x,
              styles.viewport,
              visible && styles.scrollable
            )}
            ref={ref}
            tabIndex={-1}
          >
            {children}
          </Viewport>
          <Scrollbar
            className={clsx(styles.x, styles.scrollbar)}
            key={layer_count}
            orientation="vertical"
          >
            <Thumb />
          </Scrollbar>
        </>
      );
    }
  )
);

Scroller.displayName = "Scroller";

// Scroll seek placeholder

const ScrollSeekPlaceholder = React.memo(LayerSkeleton);

ScrollSeekPlaceholder.displayName = "ScrollSeekPlaceholder";

// Placeholder

const LayerPlaceholder = React.memo<React.ComponentPropsWithoutRef<"span">>(
  ({ children, ...rest }) => (
    <span {...rest} className={clsx(styles.x, styles.placeholder)}>
      {children}
    </span>
  )
);

LayerPlaceholder.displayName = "LayerPlaceholder";

const Layers = (): React.ReactElement | null => {
  const droppable_id = React.useId();
  const canvas = use_canvas();
  const [layers, set_layers] = React.useState<BaseFabricObject[]>([]);
  const { ref, height = 1 } = use_resize_observer();
  const set_dragging = use_set_atom(is_layers_dragging_atom);

  React.useEffect(() => {
    const { current } = canvas;

    /**
     * Updates the layers
     */
    const update_layers = (): void => {
      if (current) {
        const next_layers = current.getObjects();
        set_layers(next_layers.reverse());
      }
    };

    /**
     * Updates layers if a specific set of properties get
     * modified
     * @param options Options
     */
    const update_layers_if_modified = (options: {
      target: BaseFabricObject;
    }): void => {
      const next_layer = options.target;
      const prev_layer = layers.find(
        (layer) => layer.get("id") === next_layer.get("id")
      );

      if (prev_layer) {
        if (
          prev_layer.get("locked") !== next_layer.get("locked") ||
          prev_layer.get("visible") !== next_layer.get("visible")
        ) {
          update_layers();
        }
      }
    };

    if (current) {
      current.on("object:added", update_layers);
      current.on("object:removed", update_layers);
      current.on("object:modified", update_layers_if_modified);
      current.on("selection:created", update_layers);
      current.on("selection:updated", update_layers);
      current.on("selection:cleared", update_layers);
    }

    update_layers();

    return () => {
      if (current) {
        current.off("object:added", update_layers);
        current.off("object:removed", update_layers);
        current.off("object:modified", update_layers_if_modified);
        current.off("selection:created", update_layers);
        current.off("selection:updated", update_layers);
        current.off("selection:cleared", update_layers);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  const on_drag_end = React.useCallback(
    (result: DropResult) => {
      set_dragging(false);

      if (
        !result.destination ||
        result.source.index === result.destination.index
      ) {
        return;
      }

      const start_index = result.source.index;
      const end_index = result.destination.index;

      if (canvas.current) {
        const objects = canvas.current.getObjects();
        const source_object =
          canvas.current.getObjects()[objects.length - 1 - start_index];

        if (source_object) {
          canvas.current.moveObjectTo(
            source_object,
            objects.length - 1 - end_index
          );

          set_layers((prev_layers) => {
            const [removed] = prev_layers.splice(start_index, 1);
            prev_layers.splice(end_index, 0, removed);
            return prev_layers;
          });
        }
      }
    },
    [canvas, set_dragging]
  );

  if (!layers.length) {
    return null;
  }

  return (
    <LayersContext.Provider
      value={{ layer_count: layers.length, panel_height: height }}
    >
      <DragDropContext
        onDragEnd={on_drag_end}
        onDragStart={(): void => set_dragging(true)}
      >
        <Droppable
          droppableId={droppable_id}
          mode="virtual"
          renderClone={(provided, snapshot, rubric): React.ReactElement => (
            <VirtualizedLayer
              is_dragging={snapshot.isDragging}
              layer={layers[rubric.source.index]}
              provided={provided}
            />
          )}
        >
          {(provided): React.ReactElement => (
            <Root
              asChild
              className={clsx("full-h", "flex-col", styles.x, styles.layers)}
              ref={ref}
              type={"auto"}
            >
              <ul>
                <Virtuoso<BaseFabricObject>
                  className={clsx("full-w", "full-h")}
                  components={{
                    Item: LayerPlaceholder,
                    Scroller,
                    ScrollSeekPlaceholder
                  }}
                  data={layers}
                  fixedItemHeight={LAYER_HEIGHT}
                  itemContent={(index, item): React.ReactElement => (
                    <Draggable
                      draggableId={item.get("id")}
                      index={index}
                      key={item.get("id")}
                    >
                      {(provided): React.ReactElement => (
                        <VirtualizedLayer
                          is_dragging={false}
                          layer={item}
                          provided={provided}
                        />
                      )}
                    </Draggable>
                  )}
                  overscan={32}
                  scrollSeekConfiguration={{
                    enter: (velocity): boolean => Math.abs(velocity) > 950,
                    exit: (velocity): boolean => Math.abs(velocity) < 10
                  }}
                  scrollerRef={(layer): void =>
                    provided.innerRef(layer as HTMLElement)
                  }
                />
              </ul>
            </Root>
          )}
        </Droppable>
      </DragDropContext>
    </LayersContext.Provider>
  );
};

export default Layers;
