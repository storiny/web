/**
 * Taken from https://github.com/rpearce/react-medium-image-zoom
 */

import clsx from "clsx";
import { nanoid } from "nanoid";
import React from "react";
import ReactDOM from "react-dom";

import IconButton from "~/components/icon-button";
import { SupportedZoomImage } from "~/components/zoom/types";
import MaximizeIcon from "~/icons/maximize";
import MinimizeIcon from "~/icons/minimize";

import {
  get_ghost_style,
  get_img_alt,
  get_img_src,
  get_modal_img_style,
  test_div,
  test_img,
  test_img_loaded
} from "./utils";
import styles from "./zoom.module.scss";
import { ZoomProps } from "./zoom.props";

/**
 * The selector query used to find and track the image.
 */
const IMAGE_QUERY = ["img", '[role="img"]', "[data-zoom]"]
  .map((x) => `${x}:not([aria-hidden="true"])`)
  .join(",");

const enum ModalState {
  LOADED = "loaded",
  LOADING = "loading",
  UNLOADED = "unloaded",
  UNLOADING = "unloading"
}

interface BodyAttrs {
  overflow: string;
  width: string;
}

/**
 * Helps keep track of some key `<body>` attributes so we can remove and re-add
 * them when disabling and re-enabling body scrolling.
 */
const default_body_attrs: BodyAttrs = {
  overflow: "",
  width: ""
};

interface ZoomDefaultProps {
  swipe_to_unzoom_threshold: number;
  wrap_element: "div" | "span";
  zoom_margin: number;
}

type ZoomPropsWithDefaults = ZoomDefaultProps &
  ZoomProps & {
    /**
     * Boolean indicating whether the image or content is zoomed.
     */
    is_zoomed: boolean;
    /**
     * The callback function that is triggered when the zoom state changes.
     */
    on_zoom_change?: (value: boolean) => void;
  };

interface ZoomState {
  ghost_style: React.CSSProperties;
  id: string;
  is_zoom_img_loaded: boolean;
  loaded_img_element: HTMLImageElement | undefined;
  modal_state: ModalState;
  navbar_element: HTMLElement | null;
  should_refresh: boolean;
}

class ZoomBase extends React.Component<ZoomPropsWithDefaults, ZoomState> {
  static defaultProps: ZoomDefaultProps = {
    swipe_to_unzoom_threshold: 10,
    wrap_element: "div",
    zoom_margin: 0
  };

  state: ZoomState = {
    id: "",
    is_zoom_img_loaded: false,
    loaded_img_element: undefined,
    modal_state: ModalState.UNLOADED,
    should_refresh: false,
    ghost_style: {},
    navbar_element: null
  };

  private content_ref = React.createRef<HTMLDivElement>();
  private dialog_ref = React.createRef<HTMLDialogElement>();
  private modal_content_ref = React.createRef<HTMLDivElement>();
  private modal_img_ref = React.createRef<HTMLImageElement>();
  private wrap_ref = React.createRef<HTMLDivElement>();

  private content_change_observer: MutationObserver | undefined;
  private content_not_found_change_observer: MutationObserver | undefined;
  private img_element: SupportedZoomImage | null = null;
  private img_element_resize_observer: ResizeObserver | undefined;
  private is_scaling = false;
  private prev_body_attrs: BodyAttrs = default_body_attrs;
  private modal_img_style: React.CSSProperties = {};
  private touch_y_start?: number;
  private touch_y_end?: number;

  private timeout_transition_end?: ReturnType<typeof setTimeout>;
  private navbar_element: HTMLElement | null = null;

  /**
   * Handles state changes for modal visibility and sets up or cleans up necessary event listeners.
   * @param prev_modal_state The previous modal state.
   */
  handle_modal_state_change = (
    prev_modal_state: ZoomState["modal_state"]
  ): void => {
    const { modal_state } = this.state;

    if (
      prev_modal_state !== ModalState.LOADING &&
      modal_state === ModalState.LOADING
    ) {
      this.load_zoom_img();

      window.addEventListener("resize", this.handle_resize, { passive: true });
      window.addEventListener("touchstart", this.handle_touch_start, {
        passive: true
      });
      window.addEventListener("touchmove", this.handle_touch_move, {
        passive: true
      });
      window.addEventListener("touchend", this.handle_touch_end, {
        passive: true
      });
      window.addEventListener("touchcancel", this.handle_touch_cancel, {
        passive: true
      });
      document.addEventListener("keydown", this.handle_key_down, true);
    } else if (
      prev_modal_state !== ModalState.LOADED &&
      modal_state === ModalState.LOADED
    ) {
      window.addEventListener("wheel", this.handle_wheel, { passive: true });
    } else if (
      prev_modal_state !== ModalState.UNLOADING &&
      modal_state === ModalState.UNLOADING
    ) {
      this.ensure_img_transition_end();

      window.removeEventListener("wheel", this.handle_wheel);
      window.removeEventListener("touchstart", this.handle_touch_start);
      window.removeEventListener("touchmove", this.handle_touch_move);
      window.removeEventListener("touchend", this.handle_touch_end);
      window.removeEventListener("touchcancel", this.handle_touch_cancel);
      document.removeEventListener("keydown", this.handle_key_down, true);
    } else if (
      prev_modal_state !== ModalState.UNLOADED &&
      modal_state === ModalState.UNLOADED
    ) {
      this.body_scroll_enable();

      window.removeEventListener("resize", this.handle_resize);

      this.modal_img_ref.current?.removeEventListener?.(
        "transitionend",
        this.handle_img_transition_end
      );
      this.dialog_ref.current?.close?.();
    }
  };

  /**
   * Finds or creates a container for the dialog.
   */
  get_dialog_container = (): HTMLDivElement => {
    let element = document.querySelector("[data-zoom-portal]");

    if (element == null) {
      element = document.createElement("div");
      element.setAttribute("data-zoom-portal", "");
      document.body.appendChild(element);
    }

    return element as HTMLDivElement;
  };

  /**
   * Sets a unique ID for the component after the initial render (because of
   * SSR).
   */
  set_id = (): void => {
    this.setState({ id: nanoid(12) });
  };

  /**
   * Finds and tracks the image element to be zoomed.
   */
  set_and_track_img = (): void => {
    const content_element = this.content_ref.current;

    if (!content_element) {
      return;
    }

    this.img_element = content_element.querySelector(
      IMAGE_QUERY
    ) as SupportedZoomImage | null;

    if (this.img_element) {
      this.content_not_found_change_observer?.disconnect?.();
      this.img_element.addEventListener("load", this.handle_img_load);
      this.img_element.addEventListener("click", this.handle_zoom);

      if (!this.state.loaded_img_element) {
        this.handle_img_load();
      }

      this.img_element_resize_observer = new ResizeObserver((entries) => {
        const entry = entries[0];

        if (entry?.target) {
          this.img_element = entry.target as SupportedZoomImage;

          // Update ghost and force a re-render.
          // Note: Always force a re-render here, even if we remove all state
          // changes. Pass `{}` in that case.
          this.setState({ ghost_style: get_ghost_style(this.img_element) });
        }
      });

      this.img_element_resize_observer.observe(this.img_element);

      // Watch for any reasonable DOM changes and update ghost.
      if (!this.content_change_observer) {
        this.content_change_observer = new MutationObserver(() => {
          this.setState({ ghost_style: get_ghost_style(this.img_element) });
        });

        this.content_change_observer.observe(content_element, {
          attributes: true,

          childList: true,
          subtree: true
        });
      }
    } else if (!this.content_not_found_change_observer) {
      this.content_not_found_change_observer = new MutationObserver(
        this.set_and_track_img
      );
      this.content_not_found_change_observer.observe(content_element, {
        childList: true,
        subtree: true
      });
    }
  };

  /**
   * Handles modal visibility based on the `is_zoomed` prop.
   * @param prev_is_zoomed The previous zoom state.
   */
  handle_zoom_changed = (prev_is_zoomed: boolean): void => {
    const { is_zoomed } = this.props;

    if (!prev_is_zoomed && is_zoomed) {
      this.zoom();
    } else if (prev_is_zoomed && !is_zoomed) {
      this.unzoom();
    }
  };

  /**
   * Handles the loading of the image.
   */
  handle_img_load = (): void => {
    const img_src = get_img_src(this.img_element);

    if (!img_src) return;

    const img = new Image();

    if (test_img(this.img_element)) {
      img.sizes = this.img_element.sizes;
      img.srcset = this.img_element.srcset;
      img.crossOrigin = this.img_element.crossOrigin;
    }

    // `img.src` must be set after `sizes` and `srcset` because of Firefox
    // flickering on zoom.
    img.src = img_src;

    const set_loaded = (): void => {
      this.setState({
        loaded_img_element: img,
        ghost_style: get_ghost_style(this.img_element)
      });
    };

    img
      .decode()
      .then(set_loaded)
      .catch(() => {
        if (test_img_loaded(img)) {
          set_loaded();
          return;
        }

        img.onload = set_loaded;
      });
  };

  /**
   * Handles zooming actions when the image is clicked.
   */
  handle_zoom = (): void => {
    if (this.has_image()) {
      this.props.on_zoom_change?.(true);
    }
  };

  /**
   * Handles unzooming actions when the zoomed image is clicked.
   */
  handle_unzoom = (): void => {
    this.props.on_zoom_change?.(false);
  };

  /**
   * Handles click event to unzoom when the unzoom button is clicked.
   * @param event The mouse click event.
   */
  handle_unzoom_button_click = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    event.stopPropagation();
    this.handle_unzoom();
  };

  /**
   * Prevents the dialog from closing on Escape key press.
   * @param event The synthetic event triggered by pressing Escape.
   */
  handle_dialog_cancel = (event: React.SyntheticEvent): void => {
    event.preventDefault();
  };

  /**
   * Handles dialog click events, preventing closing unless on specific elements.
   * @param event The mouse click event.
   */
  handle_dialog_click = (event: React.MouseEvent<HTMLDialogElement>): void => {
    if (
      event.target === this.modal_content_ref.current ||
      event.target === this.modal_img_ref.current
    ) {
      event.stopPropagation();
      this.handle_unzoom();
    }
  };

  /**
   * Prevents dialog's close event from propagating and closes zoom modal.
   * @param event The synthetic close event triggered by the dialog.
   */
  handle_dialog_close = (
    event: React.SyntheticEvent<HTMLDialogElement>
  ): void => {
    event.stopPropagation();
    this.handle_unzoom();
  };

  /**
   * Intercepts the Escape key press to handle unzooming when pressed.
   * @param event The keyboard event triggered by pressing a key.
   */
  handle_key_down = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || event.keyCode === 27) {
      event.preventDefault();
      event.stopPropagation();
      this.handle_unzoom();
    }
  };

  /**
   * Handles unzooming when a mouse wheel event is detected.
   * @param event The wheel event triggered by scrolling.
   */
  handle_wheel = (event: WheelEvent): void => {
    // Don't handle the event when the user is zooming with ctrl + wheel (or
    // with pinch to zoom)
    if (event.ctrlKey) return;

    event.stopPropagation();

    queueMicrotask(() => {
      this.handle_unzoom();
    });
  };

  /**
   * Starts tracking the Y-axis for swipe gestures and prevents non-scroll gestures like pinch-to-zoom.
   * @param event The touch event triggered when a touch starts.
   */
  handle_touch_start = (event: TouchEvent): void => {
    if (event.touches.length > 1) {
      this.is_scaling = true;
      return;
    }

    if (event.changedTouches.length === 1 && event.changedTouches[0]) {
      this.touch_y_start = event.changedTouches[0].screenY;
    }
  };

  /**
   * Tracks the Y-axis movement during touch events and unzooms if swipe gesture is detected.
   * @param event The touch event triggered during movement.
   */
  handle_touch_move = (event: TouchEvent): void => {
    const browser_scale = window.visualViewport?.scale ?? 1;

    if (
      !this.is_scaling &&
      browser_scale <= 1 &&
      this.touch_y_start != null &&
      event.changedTouches[0]
    ) {
      this.touch_y_end = event.changedTouches[0].screenY;

      const max = Math.max(this.touch_y_start, this.touch_y_end);
      const min = Math.min(this.touch_y_start, this.touch_y_end);
      const delta = Math.abs(max - min);

      if (delta > this.props.swipe_to_unzoom_threshold) {
        this.touch_y_start = undefined;
        this.touch_y_end = undefined;
        this.handle_unzoom();
      }
    }
  };

  /**
   * Resets touch tracking when the touch ends.
   */
  handle_touch_end = (): void => {
    this.is_scaling = false;
    this.touch_y_start = undefined;
    this.touch_y_end = undefined;
  };

  /**
   * Resets touch tracking if the touch is canceled.
   */
  handle_touch_cancel = (): void => {
    this.is_scaling = false;
    this.touch_y_start = undefined;
    this.touch_y_end = undefined;
  };

  /**
   * Forces a re-render of the component when the window is resized.
   */
  handle_resize = (): void => {
    this.setState({ should_refresh: true });
  };

  /**
   * Checks whether a valid image is loaded and available for zooming.
   */
  has_image = (): boolean => {
    return !!(
      this.img_element &&
      this.state.loaded_img_element &&
      window.getComputedStyle(this.img_element).display !== "none"
    );
  };

  /**
   * Performs the zooming actions.
   */
  zoom = (): void => {
    this.body_scroll_disable();
    this.dialog_ref.current?.showModal?.();
    this.modal_img_ref.current?.addEventListener?.(
      "transitionend",
      this.handle_img_transition_end
    ); // Must be added after showModal
    this.set_navbar_visibility(true);
    this.setState({ modal_state: ModalState.LOADING });
  };

  /**
   * Performs the unzooming actions.
   */
  unzoom = (): void => {
    this.set_navbar_visibility(false);
    this.setState({ modal_state: ModalState.UNLOADING });
  };

  /**
   * Handles the end of the zoom/unzoom transition and updates the modal state
   * accordingly.
   */
  handle_img_transition_end = (): void => {
    clearTimeout(this.timeout_transition_end);

    if (this.state.modal_state === ModalState.LOADING) {
      this.setState({ modal_state: ModalState.LOADED });
    } else if (this.state.modal_state === ModalState.UNLOADING) {
      this.setState({
        should_refresh: false,
        modal_state: ModalState.UNLOADED
      });
    }
  };

  /**
   * Ensures the `handle_img_transition_end` is called, accounting for possible
   * delays in Safari.
   */
  ensure_img_transition_end = (): void => {
    if (this.modal_img_ref.current) {
      const td = window.getComputedStyle(
        this.modal_img_ref.current
      ).transitionDuration;
      const td_float = parseFloat(td);

      if (td_float) {
        const td_ms = td_float * (td.endsWith("ms") ? 1 : 1000) + 50;
        this.timeout_transition_end = setTimeout(
          this.handle_img_transition_end,
          td_ms
        );
      }
    }
  };

  /**
   * Disables body scrolling.
   */
  body_scroll_disable = (): void => {
    this.prev_body_attrs = {
      overflow: document.body.style.overflow,
      width: document.body.style.width
    };

    // Get `client_width` before setting overflow: 'hidden'.
    const client_width = document.body.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.width = `${client_width}px`;
  };

  /**
   * Enables body scrolling.
   */
  body_scroll_enable = (): void => {
    document.body.style.width = this.prev_body_attrs.width;
    document.body.style.overflow = this.prev_body_attrs.overflow;
    this.prev_body_attrs = default_body_attrs;
  };

  /**
   * Loads the zoom image manually to ensure the correct image is displayed.
   */
  load_zoom_img = (): void => {
    const {
      props: { slot_props: { zoom_img } = {} }
    } = this;
    const zoom_img_src = zoom_img?.src;

    if (zoom_img_src) {
      const img = new Image();
      img.sizes = zoom_img?.sizes ?? "";
      img.srcset = zoom_img?.srcSet ?? "";
      // @ts-expect-error crossOrigin type is odd
      img.crossOrigin = zoom_img?.crossOrigin ?? undefined;
      img.src = zoom_img_src;

      const set_loaded = (): void => {
        this.setState({ is_zoom_img_loaded: true });
      };

      img
        .decode()
        .then(set_loaded)
        .catch(() => {
          if (test_img_loaded(img)) {
            set_loaded();
            return;
          }

          img.onload = set_loaded;
        });
    }
  };

  /**
   * Changes the `data-hidden` attribute of the navbar.
   * @param hidden The hidden flag for navbar.
   */
  set_navbar_visibility(hidden: boolean): void {
    this.navbar_element?.setAttribute?.("data-hidden", String(hidden));
  }

  render(): React.ReactElement {
    const {
      handle_unzoom_button_click,
      handle_dialog_cancel,
      handle_dialog_click,
      handle_dialog_close,
      handle_zoom,
      img_element,
      props: {
        children,
        dialog_class,
        is_zoomed,
        wrap_element: WrapElement,
        slot_props: { zoom_img } = {},
        zoom_margin
      },
      content_ref,
      dialog_ref,
      modal_content_ref,
      modal_img_ref,
      wrap_ref,
      state: {
        id,
        is_zoom_img_loaded,
        loaded_img_element,
        modal_state,
        should_refresh,
        ghost_style
      }
    } = this;

    const modal_id = `zoom-modal-${id}`;
    const modal_img_id = `zoom-modal-img-${id}`;

    const is_div = test_div(img_element);
    const is_img = test_img(img_element);

    const img_alt = get_img_alt(img_element);
    const img_src = get_img_src(img_element);
    const img_src_set = is_img ? img_element.srcset : undefined;
    const img_cross_origin = is_img ? img_element.crossOrigin : undefined;

    const has_zoom_img = !!zoom_img?.src;
    const has_image = this.has_image();

    const zoom_button_label = img_alt
      ? `Expand image: ${img_alt}`
      : "Expand image";

    const is_modal_active =
      modal_state === ModalState.LOADING || modal_state === ModalState.LOADED;

    const data_content_state = has_image ? "ready" : "idle";
    const data_overlay_state =
      modal_state === ModalState.UNLOADED ||
      modal_state === ModalState.UNLOADING
        ? "hidden"
        : "visible";

    const content_style: React.CSSProperties = {
      visibility: modal_state === ModalState.UNLOADED ? "visible" : "hidden"
    };

    this.modal_img_style = has_image
      ? get_modal_img_style({
          has_zoom_img,
          img_src,
          is_zoomed: is_zoomed && is_modal_active,
          loaded_img_element,
          offset: zoom_margin,
          should_refresh,
          target_element: img_element as SupportedZoomImage
        })
      : {};

    let modal_content = null;

    if (has_image) {
      const modal_img =
        is_img || is_div ? (
          <img
            alt={img_alt}
            // @ts-expect-error Override
            crossOrigin={img_cross_origin}
            src={img_src}
            srcSet={img_src_set}
            {...(is_zoom_img_loaded && modal_state === ModalState.LOADED
              ? zoom_img
              : {})}
            className={styles["modal-img"]}
            height={this.modal_img_style.height || undefined}
            id={modal_img_id}
            ref={modal_img_ref}
            style={this.modal_img_style}
            width={this.modal_img_style.width || undefined}
          />
        ) : null;

      const modal_unzoom_button = (
        <IconButton
          aria-label={"Minimize image"}
          className={styles["unzoom-btn"]}
          onClick={handle_unzoom_button_click}
          variant={"ghost"}
        >
          <MinimizeIcon />
        </IconButton>
      );

      modal_content = (
        <>
          {modal_img}
          {modal_unzoom_button}
        </>
      );
    }

    return (
      <WrapElement
        aria-owns={modal_id}
        className={clsx(
          styles.zoom,
          data_overlay_state === "visible" && styles.active
        )}
        ref={wrap_ref}
      >
        <WrapElement
          className={styles.content}
          data-state={data_content_state}
          ref={content_ref}
          style={content_style}
        >
          {children}
        </WrapElement>
        {has_image && (
          <WrapElement className={styles.ghost} style={ghost_style}>
            <IconButton
              aria-label={zoom_button_label}
              className={styles["zoom-btn"]}
              onClick={handle_zoom}
              variant={"ghost"}
            >
              <MaximizeIcon />
            </IconButton>
          </WrapElement>
        )}
        {has_image &&
          ReactDOM.createPortal(
            <dialog
              aria-labelledby={modal_img_id}
              aria-modal="true"
              className={clsx(styles.modal, dialog_class)}
              id={modal_id}
              onCancel={handle_dialog_cancel}
              onClick={handle_dialog_click}
              onClose={handle_dialog_close}
              ref={dialog_ref}
              role="dialog"
            >
              <div className={styles.overlay} data-state={data_overlay_state} />
              <div className={styles["modal-content"]} ref={modal_content_ref}>
                {modal_content}
              </div>
            </dialog>,
            this.get_dialog_container()
          )}
      </WrapElement>
    );
  }

  componentDidMount(): void {
    this.set_id();
    this.set_and_track_img();
    this.handle_img_load();
    this.navbar_element = document.querySelector("[data-global-header]");
  }

  componentWillUnmount(): void {
    if (this.state.modal_state !== ModalState.UNLOADED) {
      this.body_scroll_enable();
    }

    this.content_change_observer?.disconnect?.();
    this.content_not_found_change_observer?.disconnect?.();
    this.img_element_resize_observer?.disconnect?.();
    this.img_element?.removeEventListener?.("load", this.handle_img_load);
    this.img_element?.removeEventListener?.("click", this.handle_zoom);
    this.modal_img_ref.current?.removeEventListener?.(
      "transitionend",
      this.handle_img_transition_end
    );

    window.removeEventListener("wheel", this.handle_wheel);
    window.removeEventListener("touchstart", this.handle_touch_start);
    window.removeEventListener("touchmove", this.handle_touch_move);
    window.removeEventListener("touchend", this.handle_touch_end);
    window.removeEventListener("touchcancel", this.handle_touch_cancel);
    window.removeEventListener("resize", this.handle_resize);
    document.removeEventListener("keydown", this.handle_key_down, true);

    this.set_navbar_visibility(false);
  }

  componentDidUpdate(
    prev_props: ZoomPropsWithDefaults,
    prev_state: ZoomState
  ): void {
    this.handle_modal_state_change(prev_state.modal_state);
    this.handle_zoom_changed(prev_props.is_zoomed);
  }
}

const Zoom = (props: ZoomProps): React.ReactElement => {
  const [is_zoomed, set_is_zoomed] = React.useState<boolean>(false);
  return (
    <ZoomBase {...props} is_zoomed={is_zoomed} on_zoom_change={set_is_zoomed} />
  );
};

export default Zoom;
