import clsx from "clsx";
import React from "react";

import styles from "./masonry.module.scss";
import { MasonryProps } from "./masonry.props";
import MeasureItems from "./measure-items";
import Scroller from "./scroller";
import { HeightStore, MeasurementStore } from "./store";
import { Cache, Position } from "./types";
import {
  debounce,
  DebounceReturn,
  get_element_height,
  get_items_position,
  get_scroll_pos,
  get_scroll_top,
  layout_number_to_css,
  throttle,
  ThrottleReturn
} from "./utils";

const RESIZE_DEBOUNCE = 300;
const DEFAULT_COLUMN_WIDTH = 228;
const DEFAULT_MIN_COLS = 3;
const DEFAULT_OVERSCAN_FACTOR = 1;

type MasonryState<T> = {
  has_pending_measurements: boolean;
  is_fetching: boolean;
  items: T[];
  measurement_store: Cache<T, number>;
  scrollTop: number;
  width: number | null | undefined;
};

export default class Masonry<T extends object> extends React.Component<
  MasonryProps<T>,
  MasonryState<T>
> {
  constructor(props: MasonryProps<T>) {
    super(props);

    const measurement_store: Cache<T, number> = new MeasurementStore();
    this.container_height = 0;
    this.container_offset = 0;
    this.position_store = new MeasurementStore();
    this.height_store = new HeightStore();

    this.state = {
      has_pending_measurements: props.items.some(
        (item) => !!item && !measurement_store.has(item)
      ),
      is_fetching: false,
      items: props.items,
      measurement_store,
      scrollTop: 0,
      width: undefined
    };
  }

  static defaultProps = {
    overscan_factor: DEFAULT_OVERSCAN_FACTOR,
    min_cols: DEFAULT_MIN_COLS,
    column_width: DEFAULT_COLUMN_WIDTH
  };

  static getDerivedStateFromProps<K>(
    props: MasonryProps<K>,
    state: MasonryState<K>
  ): null | {
    has_pending_measurements: boolean;
    is_fetching?: boolean;
    items: K[];
  } {
    const { items } = props;
    const { measurement_store } = state;
    // Whenever we're receiving new props, determine whether any items need to be measured
    const has_pending_measurements = items.some(
      (item) => !measurement_store.has(item)
    );

    // Shallow compares all the items
    for (let i = 0; i < items.length; i += 1) {
      // We've reached the end of our current props, and everything matches
      // If we hit this case it means we need to insert new items.
      if (state.items[i] === undefined) {
        return {
          has_pending_measurements,
          items,
          is_fetching: false
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
          has_pending_measurements,
          items,
          is_fetching: false
        };
      }
    }

    // Reset items if the item array is empty
    if (items.length === 0 && state.items.length > 0) {
      return {
        has_pending_measurements,
        items,
        is_fetching: false
      };
    }

    if (has_pending_measurements !== state.has_pending_measurements) {
      // Make sure we always update `has_pending_measurements`
      return {
        has_pending_measurements,
        items
      };
    }

    // Return null to indicate no change to state
    return null;
  }

  /**
   * Container height (px)
   * @private
   */
  private container_height: number;
  /**
   * Container offset (px)
   * @private
   */
  private container_offset: number;
  /**
   * Grid wrapper element
   * @private
   */
  private grid_wrapper: HTMLElement | null | undefined;
  /**
   * Items height store
   * @private
   */
  private height_store: HeightStore;
  /**
   * Items position store
   * @private
   */
  private position_store: Cache<T, Position>;
  /**
   * Latest result pf requested animation frame
   * @private
   */
  private insert_animation_frame:
    | ReturnType<typeof requestAnimationFrame>
    | undefined;
  /**
   * Measure timeout
   */
  public measure_timeout: NodeJS.Timeout | undefined;
  /**
   * Scroll container element
   * @private
   */
  private scroll_container: Scroller | null | undefined;

  /**
   * Renders the masonry item
   * @param item_data Item data
   * @param index Item index
   * @param position Item position
   */
  private render_masonry_component: (
    item_data: T,
    index: number,
    position: Position
  ) => React.ReactElement | null = (
    item_data,
    index,
    position
  ): React.ReactElement | null => {
    const {
      render_item,
      scroll_container,
      overscan_factor,
      get_item_key,
      slot_props
    } = this.props;
    const { top, left, width, height } = position;
    let is_visible: boolean;

    if (scroll_container && overscan_factor) {
      const virtual_buffer = this.container_height * overscan_factor;
      const offset_scroll_pos = this.state.scrollTop - this.container_offset;
      const viewport_top = offset_scroll_pos - virtual_buffer;
      const viewport_bottom =
        offset_scroll_pos + this.container_height + virtual_buffer;

      is_visible = !(
        position.top + position.height < viewport_top ||
        position.top > viewport_bottom
      );
    } else {
      // If no scroll container is passed in, items should always be visible
      is_visible = true;
    }

    if (!is_visible) {
      return null;
    }

    return (
      <div
        {...slot_props?.item}
        className={clsx(
          styles.item,
          styles.mounted,
          slot_props?.item?.className
        )}
        data-grid-item={""}
        key={get_item_key ? get_item_key(item_data) : `item-${index}`}
        role="listitem"
        style={{
          ...slot_props?.item?.style,
          top: 0,
          left: 0,
          transform: `translateX(${left}px) translateY(${top}px)`,
          WebkitTransform: `translateX(${left}px) translateY(${top}px)`,
          width: layout_number_to_css(width),
          height: layout_number_to_css(height)
        }}
      >
        {render_item({
          data: item_data,
          item_index: index,
          is_measuring: false
        })}
      </div>
    );
  };

  /**
   * Delays resize handling in case the scroll container is still being resized
   */
  private handle_resize: DebounceReturn = debounce(() => {
    if (this.grid_wrapper) {
      this.setState({
        width: this.grid_wrapper.clientWidth
      });
    }
  }, RESIZE_DEBOUNCE);

  /**
   * Updates scroll container scroll position
   *
   * Using throttle here to schedule the handler async, outside the event
   * loop that produced the event
   */
  private update_scroll_position: ThrottleReturn = throttle(() => {
    if (!this.scroll_container) {
      return;
    }

    const scroll_container = this.scroll_container.get_scroll_container_ref();

    if (!scroll_container) {
      return;
    }

    this.setState({
      scrollTop: get_scroll_pos(scroll_container)
    });
  });

  /**
   * Measures scroll container asynchronously
   */
  private measure_container_async: DebounceReturn = debounce(() => {
    this.measure_container();
  }, 0);

  /**
   * Sets grid wrapper
   * @param ref Grid wrapper ref
   */
  private set_grid_wrapper_ref: (ref: HTMLElement | null | undefined) => void =
    (ref: HTMLElement | null | undefined) => {
      this.grid_wrapper = ref;
    };

  /**
   * Sets scroller ref
   * @param ref Scroller ref
   */
  private set_scroll_container_ref: (ref: Scroller | null | undefined) => void =
    (ref: Scroller | null | undefined) => {
      this.scroll_container = ref;
    };

  /**
   * Adds hooks after the component mounts
   */
  componentDidMount(): void {
    window.addEventListener("resize", this.handle_resize);
    this.measure_container();
    let { scrollTop } = this.state;

    if (this.scroll_container != null) {
      const scroll_container = this.scroll_container.get_scroll_container_ref();
      if (scroll_container) {
        scrollTop = get_scroll_pos(scroll_container);
      }
    }

    this.setState((prev_state) => ({
      scrollTop,
      width: this.grid_wrapper
        ? this.grid_wrapper.clientWidth
        : prev_state.width
    }));
  }

  componentDidUpdate(_: MasonryProps<T>, prev_state: MasonryState<T>): void {
    const { items } = this.props;
    const { measurement_store } = this.state;
    this.measure_container_async();

    if (prev_state.width != null && this.state.width !== prev_state.width) {
      measurement_store.reset();
      this.position_store.reset();
      this.height_store.reset();
    }

    // Calculate whether we still have pending measurements
    const has_pending_measurements = items.some(
      (item) => !!item && !measurement_store.has(item)
    );

    if (
      has_pending_measurements ||
      has_pending_measurements !== this.state.has_pending_measurements ||
      prev_state.width == null
    ) {
      // This helps prevent jank
      this.insert_animation_frame = requestAnimationFrame(() => {
        this.setState({
          has_pending_measurements
        });
      });
    }
  }

  /**
   * Remove listeners when unmounting
   */
  componentWillUnmount(): void {
    if (this.insert_animation_frame) {
      cancelAnimationFrame(this.insert_animation_frame);
    }

    // Make sure async methods get canceled
    this.measure_container_async.clearTimeout();
    this.handle_resize.clearTimeout();
    this.update_scroll_position.clearTimeout();
    window.removeEventListener("resize", this.handle_resize);
  }

  /**
   * Measures the grid container
   */
  private measure_container(): void {
    if (this.scroll_container) {
      const { scroll_container } = this;
      const scroll_container_ref = scroll_container?.get_scroll_container_ref();

      if (scroll_container_ref) {
        this.container_height = get_element_height(scroll_container_ref);
        const element = this.grid_wrapper;

        if (element instanceof HTMLElement) {
          const relative_scroll_top = get_scroll_top(scroll_container_ref);
          this.container_offset =
            element.getBoundingClientRect().top + relative_scroll_top;
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
  public reflow(): void {
    this.state.measurement_store.reset();
    this.position_store.reset();
    this.height_store.reset();
    this.measure_container();
    this.forceUpdate();
  }

  /**
   * Main render function
   */
  render(): React.ReactElement {
    const {
      column_width,
      gutter_width: gutter,
      items,
      min_cols,
      render_item,
      get_item_key,
      scroll_container,
      slot_props
    } = this.props;
    const { has_pending_measurements, measurement_store, width } = this.state;
    const get_positions = get_items_position({
      gutter,
      cache: measurement_store,
      min_cols,
      ideal_column_width: column_width,
      width
    });
    let grid_body: React.ReactElement;

    if (width === null && has_pending_measurements) {
      // When hyrdating from a server render, we don't have the width of the grid and the measurement store is empty
      grid_body = (
        <div
          {...slot_props?.container}
          className={clsx(styles.masonry, slot_props?.container?.className)}
          ref={this.set_grid_wrapper_ref}
          role="list"
          style={{
            ...slot_props?.container?.style,
            height: 0,
            width: "100%"
          }}
        >
          {items.filter(Boolean).map((item, i) => (
            <div
              {...slot_props?.item}
              data-grid-item={""}
              key={get_item_key ? get_item_key(item) : i}
              ref={(element): void => {
                if (element) {
                  measurement_store.set(item, element.clientHeight);
                }
              }}
              role="listitem"
              style={{
                ...slot_props?.item?.style,
                top: 0,
                left: 0,
                transform: "translateX(0px) translateY(0px)",
                WebkitTransform: "translateX(0px) translateY(0px)"
              }}
            >
              {render_item({
                data: item,
                item_index: i,
                is_measuring: false
              })}
            </div>
          ))}
        </div>
      );
    } else if (width === null) {
      // When the width is empty (usually after a re-mount), render an empty div to collect the width for layout
      grid_body = (
        <div
          ref={this.set_grid_wrapper_ref}
          style={{
            width: "100%"
          }}
        />
      );
    } else {
      // Full layout is possible
      const items_with_measurements = items.filter(
        (item) => item && measurement_store.has(item)
      );
      const items_to_render = items_with_measurements;
      const items_to_measure = items
        .filter((item) => item && !measurement_store.has(item))
        .slice(0, min_cols);
      const positions = get_positions(items_with_measurements);
      const height = positions.length
        ? Math.max(...positions.map((pos) => pos.top + pos.height))
        : 0;

      grid_body = (
        <div
          ref={this.set_grid_wrapper_ref}
          style={{
            width: "100%"
          }}
        >
          <div
            {...slot_props?.container}
            className={clsx(styles.masonry, slot_props?.container?.className)}
            role="list"
            style={{
              ...slot_props?.container?.style,
              height,
              width
            }}
          >
            {items_to_render.map((item, i) =>
              this.render_masonry_component(item, i, positions[i])
            )}
          </div>
          <div
            {...slot_props?.container}
            className={clsx(styles.masonry, slot_props?.container?.className)}
            style={{
              ...slot_props?.container?.style,
              width
            }}
          >
            <MeasureItems<T>
              {...slot_props?.item}
              base_index={items_with_measurements.length}
              get_positions={get_positions}
              items={items_to_measure}
              measurement_store={measurement_store}
              render_item={render_item}
            />
          </div>
        </div>
      );
    }

    return scroll_container ? (
      <Scroller
        on_scroll={this.update_scroll_position}
        ref={this.set_scroll_container_ref}
        scroll_container={scroll_container}
      >
        {grid_body}
      </Scroller>
    ) : (
      grid_body
    );
  }
}
