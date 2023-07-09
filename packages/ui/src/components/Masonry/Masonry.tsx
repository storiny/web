import clsx from "clsx";
import React from "react";

import styles from "./Masonry.module.scss";
import { MasonryProps } from "./Masonry.props";
import MeasureItems from "./MeasureItems";
import Scroller from "./Scroller";
import { HeightStore, MeasurementStore } from "./store";
import { Cache, Position } from "./types";
import {
  debounce,
  DebounceReturn,
  getElementHeight,
  getItemsPosition,
  getScrollPos,
  getScrollTop,
  layoutNumberToCss,
  throttle,
  ThrottleReturn
} from "./utils";

const RESIZE_DEBOUNCE = 300;
const DEFAULT_COLUMN_WIDTH = 228;
const DEFAULT_MIN_COLS = 3;
const DEFAULT_OVERSCAN_FACTOR = 1;

type MasonryState<T> = {
  hasPendingMeasurements: boolean;
  isFetching: boolean;
  items: T[];
  measurementStore: Cache<T, number>;
  scrollTop: number;
  width: number | null | undefined;
};

export default class Masonry<T extends {}> extends React.Component<
  MasonryProps<T>,
  MasonryState<T>
> {
  containerHeight: number;
  containerOffset: number;
  gridWrapper: HTMLElement | null | undefined;
  heightStore: HeightStore;
  positionStore: Cache<T, Position>;
  insertAnimationFrame: ReturnType<typeof requestAnimationFrame> | undefined;
  measureTimeout: NodeJS.Timeout | undefined;
  scrollContainer: Scroller | null | undefined;

  static defaultProps = {
    overscanFactor: DEFAULT_OVERSCAN_FACTOR,
    minCols: DEFAULT_MIN_COLS,
    columnWidth: DEFAULT_COLUMN_WIDTH
  };

  constructor(props: MasonryProps<T>) {
    super(props);

    const measurementStore: Cache<T, number> = new MeasurementStore();
    this.containerHeight = 0;
    this.containerOffset = 0;
    this.positionStore = new MeasurementStore();
    this.heightStore = new HeightStore();

    this.state = {
      hasPendingMeasurements: props.items.some(
        (item) => !!item && !measurementStore.has(item)
      ),
      isFetching: false,
      items: props.items,
      measurementStore,
      scrollTop: 0,
      width: undefined
    };
  }

  /**
   * Adds hooks after the component mounts
   */
  componentDidMount(): void {
    window.addEventListener("resize", this.handleResize);
    this.measureContainer();
    let { scrollTop } = this.state;

    if (this.scrollContainer != null) {
      const scrollContainer = this.scrollContainer.getScrollContainerRef();
      if (scrollContainer) {
        scrollTop = getScrollPos(scrollContainer);
      }
    }

    this.setState((prevState) => ({
      scrollTop,
      width: this.gridWrapper ? this.gridWrapper.clientWidth : prevState.width
    }));
  }

  componentDidUpdate(
    prevProps: MasonryProps<T>,
    prevState: MasonryState<T>
  ): void {
    const { items } = this.props;
    const { measurementStore } = this.state;
    this.measureContainerAsync();

    if (prevState.width != null && this.state.width !== prevState.width) {
      measurementStore.reset();
      this.positionStore.reset();
      this.heightStore.reset();
    }

    // Calculate whether we still have pending measurements
    const hasPendingMeasurements = items.some(
      (item) => !!item && !measurementStore.has(item)
    );

    if (
      hasPendingMeasurements ||
      hasPendingMeasurements !== this.state.hasPendingMeasurements ||
      prevState.width == null
    ) {
      // This helps prevent jank
      this.insertAnimationFrame = requestAnimationFrame(() => {
        this.setState({
          hasPendingMeasurements
        });
      });
    }
  }

  /**
   * Remove listeners when unmounting
   */
  componentWillUnmount(): void {
    if (this.insertAnimationFrame) {
      cancelAnimationFrame(this.insertAnimationFrame);
    }

    // Make sure async methods get canceled
    this.measureContainerAsync.clearTimeout();
    this.handleResize.clearTimeout();
    this.updateScrollPosition.clearTimeout();
    window.removeEventListener("resize", this.handleResize);
  }

  static getDerivedStateFromProps<K>(
    props: MasonryProps<K>,
    state: MasonryState<K>
  ): null | {
    hasPendingMeasurements: boolean;
    isFetching?: boolean;
    items: K[];
  } {
    const { items } = props;
    const { measurementStore } = state;
    // Whenever we're receiving new props, determine whether any items need to be measured
    const hasPendingMeasurements = items.some(
      (item) => !measurementStore.has(item)
    );

    // Shallow compares all the items
    for (let i = 0; i < items.length; i += 1) {
      // We've reached the end of our current props, and everything matches
      // If we hit this case it means we need to insert new items.
      if (state.items[i] === undefined) {
        return {
          hasPendingMeasurements,
          items,
          isFetching: false
        };
      }

      // Reset grid items
      if (
        // An item object ref does not match.
        items[i] !== state.items[i] ||
        // Or fewer items than we currently have are passed in
        items.length < state.items.length
      ) {
        return {
          hasPendingMeasurements,
          items,
          isFetching: false
        };
      }
    }

    // Reset items if the item array is empty
    if (items.length === 0 && state.items.length > 0) {
      return {
        hasPendingMeasurements,
        items,
        isFetching: false
      };
    }

    if (hasPendingMeasurements !== state.hasPendingMeasurements) {
      // Make sure we always update `hasPendingMeasurements`
      return {
        hasPendingMeasurements,
        items
      };
    }

    // Return null to indicate no change to state
    return null;
  }

  /**
   * Delays resize handling in case the scroll container is still being resized
   */
  handleResize: DebounceReturn = debounce(() => {
    if (this.gridWrapper) {
      this.setState({
        width: this.gridWrapper.clientWidth
      });
    }
  }, RESIZE_DEBOUNCE);

  /**
   * Updates scroll container scroll position
   *
   * Using throttle here to schedule the handler async, outside the event
   * loop that produced the event
   */
  updateScrollPosition: ThrottleReturn = throttle(() => {
    if (!this.scrollContainer) {
      return;
    }

    const scrollContainer = this.scrollContainer.getScrollContainerRef();
    if (!scrollContainer) {
      return;
    }

    this.setState({
      scrollTop: getScrollPos(scrollContainer)
    });
  });

  /**
   * Measures scroll container asynchronously
   */
  measureContainerAsync: DebounceReturn = debounce(() => {
    this.measureContainer();
  }, 0);

  /**
   * Sets grid wrapper
   * @param ref Grid wrapper ref
   */
  setGridWrapperRef: (ref: HTMLElement | null | undefined) => void = (
    ref: HTMLElement | null | undefined
  ) => {
    this.gridWrapper = ref;
  };

  /**
   * Sets scroller ref
   * @param ref Scroller ref
   */
  setScrollContainerRef: (ref: Scroller | null | undefined) => void = (
    ref: Scroller | null | undefined
  ) => {
    this.scrollContainer = ref;
  };

  /**
   * Measures the grid container
   */
  measureContainer(): void {
    if (this.scrollContainer) {
      const { scrollContainer } = this;
      const scrollContainerRef = scrollContainer.getScrollContainerRef();

      if (scrollContainerRef) {
        this.containerHeight = getElementHeight(scrollContainerRef);
        const element = this.gridWrapper;

        if (element instanceof HTMLElement) {
          const relativeScrollTop = getScrollTop(scrollContainerRef);
          this.containerOffset =
            element.getBoundingClientRect().top + relativeScrollTop;
        }
      }
    }
  }

  /**
   * Clears measurements/positions and forces a reflow of the entire grid.
   *
   * Used only if absolutely necessary, such as when the number of columns
   * we would display should change after a resize.
   */
  reflow(): void {
    this.state.measurementStore.reset();
    this.positionStore.reset();
    this.heightStore.reset();
    this.measureContainer();
    this.forceUpdate();
  }

  /**
   * Renders the masonry item
   * @param itemData Item data
   * @param index Item index
   * @param position Item position
   */
  renderMasonryComponent: (
    itemData: T,
    index: number,
    position: Position
  ) => React.ReactElement | null = (
    itemData,
    index,
    position
  ): React.ReactElement | null => {
    const {
      renderItem,
      scrollContainer,
      overscanFactor,
      getItemKey,
      slotProps
    } = this.props;
    const { top, left, width, height } = position;
    let isVisible: boolean;

    if (scrollContainer && overscanFactor) {
      const virtualBuffer = this.containerHeight * overscanFactor;
      const offsetScrollPos = this.state.scrollTop - this.containerOffset;
      const viewportTop = offsetScrollPos - virtualBuffer;
      const viewportBottom =
        offsetScrollPos + this.containerHeight + virtualBuffer;

      isVisible = !(
        position.top + position.height < viewportTop ||
        position.top > viewportBottom
      );
    } else {
      // If no scroll container is passed in, items should always be visible
      isVisible = true;
    }

    if (!isVisible) {
      return null;
    }

    return (
      <div
        {...slotProps?.item}
        className={clsx(
          styles.item,
          styles.mounted,
          slotProps?.item?.className
        )}
        data-grid-item={""}
        key={getItemKey ? getItemKey(itemData) : `item-${index}`}
        role="listitem"
        style={{
          ...slotProps?.item?.style,
          top: 0,
          left: 0,
          transform: `translateX(${left}px) translateY(${top}px)`,
          WebkitTransform: `translateX(${left}px) translateY(${top}px)`,
          width: layoutNumberToCss(width),
          height: layoutNumberToCss(height)
        }}
      >
        {renderItem({
          data: itemData,
          itemIndex: index,
          isMeasuring: false
        })}
      </div>
    );
  };

  /**
   * Main render function
   */
  render(): React.ReactElement {
    const {
      columnWidth,
      gutterWidth: gutter,
      items,
      minCols,
      renderItem,
      getItemKey,
      scrollContainer,
      slotProps
    } = this.props;
    const { hasPendingMeasurements, measurementStore, width } = this.state;
    const getPositions = getItemsPosition({
      gutter,
      cache: measurementStore,
      minCols,
      idealColumnWidth: columnWidth,
      width
    });
    let gridBody;

    if (width === null && hasPendingMeasurements) {
      // When hyrdating from a server render, we don't have the width of the grid
      // and the measurement store is empty
      gridBody = (
        <div
          {...slotProps?.container}
          className={clsx(styles.masonry, slotProps?.container?.className)}
          ref={this.setGridWrapperRef}
          role="list"
          style={{
            ...slotProps?.container?.style,
            height: 0,
            width: "100%"
          }}
        >
          {items.filter(Boolean).map((item, i) => (
            <div
              {...slotProps?.item}
              data-grid-item={""}
              key={getItemKey ? getItemKey(item) : i}
              ref={(element): void => {
                if (element) {
                  measurementStore.set(item, element.clientHeight);
                }
              }}
              role="listitem"
              style={{
                ...slotProps?.item?.style,
                top: 0,
                left: 0,
                transform: "translateX(0px) translateY(0px)",
                WebkitTransform: "translateX(0px) translateY(0px)"
              }}
            >
              {renderItem({
                data: item,
                itemIndex: i,
                isMeasuring: false
              })}
            </div>
          ))}
        </div>
      );
    } else if (width === null) {
      // When the width is empty (usually after a re-mount) render an empty
      // div to collect the width for layout
      gridBody = (
        <div
          ref={this.setGridWrapperRef}
          style={{
            width: "100%"
          }}
        />
      );
    } else {
      // Full layout is possible
      const itemsWithMeasurements = items.filter(
        (item) => item && measurementStore.has(item)
      );
      const itemsToRender = itemsWithMeasurements;
      const itemsToMeasure = items
        .filter((item) => item && !measurementStore.has(item))
        .slice(0, minCols);
      const positions = getPositions(itemsWithMeasurements);
      const height = positions.length
        ? Math.max(...positions.map((pos) => pos.top + pos.height))
        : 0;

      gridBody = (
        <div
          ref={this.setGridWrapperRef}
          style={{
            width: "100%"
          }}
        >
          <div
            {...slotProps?.container}
            className={clsx(styles.masonry, slotProps?.container?.className)}
            role="list"
            style={{
              ...slotProps?.container?.style,
              height,
              width
            }}
          >
            {itemsToRender.map((item, i) =>
              this.renderMasonryComponent(item, i, positions[i])
            )}
          </div>
          <div
            {...slotProps?.container}
            className={clsx(styles.masonry, slotProps?.container?.className)}
            style={{
              ...slotProps?.container?.style,
              width
            }}
          >
            <MeasureItems
              {...slotProps?.item}
              baseIndex={itemsWithMeasurements.length}
              getPositions={getPositions}
              items={itemsToMeasure}
              measurementStore={measurementStore}
              renderItem={renderItem}
            />
          </div>
        </div>
      );
    }

    return scrollContainer ? (
      <Scroller
        onScroll={this.updateScrollPosition}
        ref={this.setScrollContainerRef}
        scrollContainer={scrollContainer}
      >
        {gridBody}
      </Scroller>
    ) : (
      gridBody
    );
  }
}
