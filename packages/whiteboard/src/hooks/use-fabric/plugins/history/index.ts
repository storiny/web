import { get_shortcut_slug } from "@storiny/shared/src/utils/get-shortcut-slug";
import { Canvas } from "fabric";
import hotkeys from "hotkeys-js";

import { RECOVERY_KEYS } from "../../../../constants";
import { recover_object } from "../../../../utils";

type ThrottledFunction<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

/**
 * Returns a throttled function that only invokes the provided function
 * (`func`) at most once per within a given number of milliseconds
 * @param func Function to throttle
 * @param limit Limit in ms
 */
function throttle<T extends (...args: any) => any>(
  func: T,
  limit: number
): ThrottledFunction<T> {
  let in_throttle: boolean;
  let last_result: ReturnType<T>;

  return function (this: any): ReturnType<T> {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    if (!in_throttle) {
      in_throttle = true;
      setTimeout(() => (in_throttle = false), limit);
      last_result = func.apply(context, args as any);
    }

    return last_result;
  };
}

/**
 * History plugin
 */
export class HistoryPlugin {
  /**
   * Ctor
   * @param canvas Canvas
   */
  constructor(canvas: Canvas) {
    this.canvas = canvas;
    this.undo_stack = [];
    this.redo_stack = [];
    this.next_state = this.get_next_state();
    this.is_processing = false;
    this.debounced_save_action = throttle(
      this.save_action_impl.bind(this),
      100
    );
  }

  /**
   * Canvas
   * @private
   */
  private readonly canvas: Canvas;
  /**
   * Undo stack
   * @private
   */
  private undo_stack: string[];
  /**
   * Redo stack
   * @private
   */
  private redo_stack: string[];
  /**
   * Undo and redo stack limit
   * @private
   */
  private readonly stack_limit = 150;
  /**
   * Next serialized state
   * @private
   */
  private next_state: string;
  /**
   * The undo and redo processes will render the new states of the objects.
   * Therefore, `object:added` and `object:modified` events will trigger again,
   * and will cause issues
   * @private
   */
  private is_processing: boolean;
  /**
   * Debounced save action
   * @private
   */
  private readonly debounced_save_action: () => void;

  /**
   * Returns current stringified canvas state
   */
  private get_next_state(): string {
    const data = this.canvas.toDatalessJSON(RECOVERY_KEYS);

    delete data.width;
    delete data.height;

    return JSON.stringify(data);
  }

  /**
   * Saves action to the store
   * @private
   */
  private save_action(): void {
    if (this.is_processing) {
      return;
    }

    this.debounced_save_action();
  }

  /**
   * Save action implementation
   * @private
   */
  private save_action_impl(): string | void {
    const json = this.next_state;
    this.undo_stack.push(json);
    this.next_state = this.get_next_state();

    // Stack limit
    while (this.undo_stack.length > this.stack_limit) {
      this.undo_stack.shift();
    }
  }

  /**
   * Loads history to the canvas
   * @param history History
   * @private
   */
  private load_history(history: string | Record<string, any>): void {
    this.canvas
      .loadFromJSON(history, (prop, object) => recover_object(object, prop))
      .then(() => {
        this.canvas.renderAll();
        this.is_processing = false;
      });
  }

  /**
   * Undo
   */
  public undo(): void {
    this.is_processing = true;
    const history = this.undo_stack.pop();

    if (history) {
      // Push the current state to the redo stack
      this.redo_stack.push(this.get_next_state());
      this.next_state = history;
      this.load_history(history);

      // Stack limit
      while (this.redo_stack.length > this.stack_limit) {
        this.redo_stack.shift();
      }
    } else {
      this.is_processing = false;
    }
  }

  /**
   * Redo
   */
  public redo(): void {
    this.is_processing = true;
    const history = this.redo_stack.pop();

    if (history) {
      // Every redo action is actually a new action to the undo history
      this.undo_stack.push(this.get_next_state());
      this.next_state = history;
      this.load_history(history);
    } else {
      this.is_processing = false;
    }
  }

  /**
   * Clears the history
   */
  public clear(): void {
    this.undo_stack = [];
    this.redo_stack = [];
  }

  /**
   * Pauses capturing the history
   */
  public pause(): void {
    this.is_processing = true;
  }

  /**
   * Resumes capturing the history
   */
  public resume(): void {
    this.is_processing = false;
    this.save_action();
  }

  /**
   * Predicate method for determining undo
   */
  public can_undo(): boolean {
    return Boolean(this.undo_stack.length);
  }

  /**
   * Predicate method for determining undo
   */
  public can_redo(): boolean {
    return Boolean(this.redo_stack.length);
  }

  /**
   * Augments the canvas
   * @private
   */
  private augment_canvas(): void {
    this.canvas.history_manager = this;
  }

  /**
   * Binds events
   * @private
   */
  private bind_events(): void {
    this.canvas.on({
      "object:added": this.save_action.bind(this),
      "object:removed": this.save_action.bind(this),
      "object:modified": this.save_action.bind(this),
      "object:skewing": this.save_action.bind(this)
    });

    const undo_key = get_shortcut_slug({ ctrl: true, key: "z" });
    const redo_key = get_shortcut_slug({ ctrl: true, key: "y" });
    const redo_lat_key = get_shortcut_slug({
      ctrl: true,
      shift: true,
      key: "z"
    });

    hotkeys(
      [undo_key, redo_key, redo_lat_key].join(","),
      (_, hotkeys_event) => {
        switch (hotkeys_event.key) {
          case undo_key:
            this.undo();
            break;
          case redo_key:
          case redo_lat_key:
            this.redo();
            break;
          default:
            break;
        }
      }
    );
  }

  /**
   * Initialize plugin
   */
  public init(): void {
    this.bind_events();
    this.augment_canvas();
  }
}

/**
 * History plugin
 * @param canvas Canvas
 */
export const register_history = (canvas: Canvas): void => {
  new HistoryPlugin(canvas).init();
};
