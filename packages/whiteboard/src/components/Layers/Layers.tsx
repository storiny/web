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
import { useSetAtom } from "jotai";
import React from "react";
import { Virtuoso } from "react-virtuoso";
import useResizeObserver from "use-resize-observer";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/ScrollArea";

import { isLayersDraggingAtom } from "../../atoms";
import { useCanvas } from "../../hooks";
import Layer, { LayerSkeleton } from "./Layer";
import styles from "./Layers.module.scss";
import { LayersContext } from "./LayersContext";

const LAYER_HEIGHT = 28;

// Layer item

const VirtualizedLayer = React.memo<
  {
    isDragging: boolean;
    layer: BaseFabricObject;
    provided: DraggableProvided;
  } & React.ComponentPropsWithoutRef<"li">
>(({ layer, provided, isDragging, ...rest }) => (
  <Layer
    {...rest}
    {...provided.draggableProps}
    data-dragging={String(isDragging)}
    draggerProps={{
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
      const { layerCount, panelHeight } = React.useContext(LayersContext);
      const scrollHeight = layerCount * LAYER_HEIGHT;
      const visible = scrollHeight > panelHeight;

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
            key={layerCount}
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
  const droppableId = React.useId();
  const canvas = useCanvas();
  const [layers, setLayers] = React.useState<BaseFabricObject[]>([]);
  const { ref, height = 1 } = useResizeObserver();
  const setDragging = useSetAtom(isLayersDraggingAtom);

  React.useEffect(() => {
    const { current } = canvas;

    /**
     * Updates the layers
     */
    const updateLayers = (): void => {
      if (current) {
        const newLayers = current.getObjects();
        setLayers(newLayers.reverse());
      }
    };

    /**
     * Updates layers if a specific set of properties get
     * modified
     * @param options Options
     */
    const updateLayersIfModified = (options: {
      target: BaseFabricObject;
    }): void => {
      const nextLayer = options.target;
      const prevLayer = layers.find(
        (layer) => layer.get("id") === nextLayer.get("id")
      );

      if (prevLayer) {
        if (
          prevLayer.get("locked") !== nextLayer.get("locked") ||
          prevLayer.get("visible") !== nextLayer.get("visible")
        ) {
          updateLayers();
        }
      }
    };

    if (current) {
      current.on("object:added", updateLayers);
      current.on("object:removed", updateLayers);
      current.on("object:modified", updateLayersIfModified);
      current.on("selection:created", updateLayers);
      current.on("selection:updated", updateLayers);
      current.on("selection:cleared", updateLayers);
    }

    updateLayers();

    return () => {
      if (current) {
        current.off("object:added", updateLayers);
        current.off("object:removed", updateLayers);
        current.off("object:modified", updateLayersIfModified);
        current.off("selection:created", updateLayers);
        current.off("selection:updated", updateLayers);
        current.off("selection:cleared", updateLayers);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  const onDragEnd = React.useCallback(
    (result: DropResult) => {
      setDragging(false);

      if (
        !result.destination ||
        result.source.index === result.destination.index
      ) {
        return;
      }

      const startIndex = result.source.index;
      const endIndex = result.destination.index;

      if (canvas.current) {
        const objects = canvas.current.getObjects();
        const sourceObject =
          canvas.current.getObjects()[objects.length - 1 - startIndex];

        if (sourceObject) {
          canvas.current.moveObjectTo(
            sourceObject,
            objects.length - 1 - endIndex
          );

          setLayers((prevLayers) => {
            const [removed] = prevLayers.splice(startIndex, 1);
            prevLayers.splice(endIndex, 0, removed);
            return prevLayers;
          });
        }
      }
    },
    [canvas, setDragging]
  );

  if (!layers.length) {
    return null;
  }

  return (
    <LayersContext.Provider
      value={{ layerCount: layers.length, panelHeight: height }}
    >
      <DragDropContext
        onDragEnd={onDragEnd}
        onDragStart={(): void => setDragging(true)}
      >
        <Droppable
          droppableId={droppableId}
          mode="virtual"
          renderClone={(provided, snapshot, rubric): React.ReactElement => (
            <VirtualizedLayer
              isDragging={snapshot.isDragging}
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
                          isDragging={false}
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
