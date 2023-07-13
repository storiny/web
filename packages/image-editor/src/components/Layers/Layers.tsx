import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DropResult
} from "@hello-pangea/dnd";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";
import { Virtuoso } from "react-virtuoso";
import useResizeObserver from "use-resize-observer";

import { Root, Scrollbar, Thumb, Viewport } from "~/components/ScrollArea";

import { isLayersDraggingAtom } from "../../atoms";
import { Layer as TLayer } from "../../constants/layer";
import {
  reorderLayer,
  selectLayers,
  useEditorDispatch,
  useEditorSelector
} from "../../store";
import Layer, { LayerSkeleton } from "./Layer";
import styles from "./Layers.module.scss";
import { LayersContext } from "./LayersContext";

const LAYER_HEIGHT = 28;

// Layer item

const VirtualizedLayer = React.memo<
  {
    isDragging: boolean;
    layer: TLayer;
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

const Layers = (): React.ReactElement => {
  const droppableId = React.useId();
  const dispatch = useEditorDispatch();
  const layers = useEditorSelector(selectLayers);
  const { ref, height = 1 } = useResizeObserver();
  const setDragging = useSetAtom(isLayersDraggingAtom);

  const onDragEnd = React.useCallback(
    (result: DropResult) => {
      setDragging(false);

      if (
        !result.destination ||
        result.source.index === result.destination.index
      ) {
        return;
      }

      dispatch(
        reorderLayer({
          startIndex: result.source.index,
          endIndex: result.destination.index
        })
      );
    },
    [dispatch, setDragging]
  );

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
                <Virtuoso<TLayer>
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
                      draggableId={item.id}
                      index={index}
                      key={item.id}
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
                  scrollerRef={(element): void =>
                    provided.innerRef(element as HTMLElement)
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
