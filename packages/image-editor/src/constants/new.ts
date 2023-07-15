import { COLOR_PALETTE } from "./colors";
import cssVariables from "./css/variables.module.scss";
import { ExcalidrawLayer, FontFamilyValues } from "./layer/types";
import { AppProps } from "./types";

export const DRAGGING_THRESHOLD = 10; // px
export const LINE_CONFIRM_THRESHOLD = 8; // px
export const ELEMENT_SHIFT_TRANSLATE_AMOUNT = 5;
export const ELEMENT_TRANSLATE_AMOUNT = 1;
export const TEXT_TO_CENTER_SNAP_THRESHOLD = 30;
export const SHIFT_LOCKING_ANGLE = Math.PI / 12;

export const FRAME_STYLE = {
  strokeColor: "#bbb" as ExcalidrawLayer["strokeColor"],
  strokeWidth: 1 as ExcalidrawLayer["strokeWidth"],
  strokeStyle: "solid" as ExcalidrawLayer["strokeStyle"],
  fillStyle: "solid" as ExcalidrawLayer["fillStyle"],
  roughness: 0 as ExcalidrawLayer["roughness"],
  roundness: null as ExcalidrawLayer["roundness"],
  backgroundColor: "transparent" as ExcalidrawLayer["backgroundColor"],
  radius: 8
};

export const WINDOWS_EMOJI_FALLBACK_FONT = "Segoe UI Emoji";

export const DEFAULT_FONT_SIZE = 20;
export const DEFAULT_FONT_FAMILY: FontFamilyValues = 1; // Virgil
export const DEFAULT_TEXT_ALIGN = "left";
export const DEFAULT_VERTICAL_ALIGN = "top";
export const DEFAULT_VERSION = "{version}";

export const CANVAS_ONLY_ACTIONS = ["selectAll"];

export const GRID_SIZE = 20; // TODO make it configurable?

export const EXPORT_DATA_TYPES = {
  excalidraw: "excalidraw",
  excalidrawClipboard: "excalidraw/clipboard",
  excalidrawLibrary: "excalidrawlib"
} as const;

export const EXPORT_SOURCE =
  (window as any).EXCALIDRAW_EXPORT_SOURCE || window.location.origin;

// time in milliseconds
export const IMAGE_RENDER_TIMEOUT = 500;
export const TAP_TWICE_TIMEOUT = 300;
export const TOUCH_CTX_MENU_TIMEOUT = 500;
export const TITLE_TIMEOUT = 10000;
export const VERSION_TIMEOUT = 30000;
export const SCROLL_TIMEOUT = 100;
export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.1;
export const HYPERLINK_TOOLTIP_DELAY = 300;

// Report a user inactive after IDLE_THRESHOLD milliseconds
export const IDLE_THRESHOLD = 60_000;
// Report a user active each ACTIVE_THRESHOLD milliseconds
export const ACTIVE_THRESHOLD = 3_000;

export const DEFAULT_UI_OPTIONS: AppProps["UIOptions"] = {
  canvasActions: {
    changeViewBackgroundColor: true,
    clearCanvas: true,
    export: { saveFileToDisk: true },
    loadScene: true,
    saveToActiveFile: true,
    toggleTheme: null,
    saveAsImage: true
  }
};

// breakpoints
// sm screen
export const MQ_SM_MAX_WIDTH = 640;
// md screen
export const MQ_MAX_WIDTH_PORTRAIT = 730;
export const MQ_MAX_WIDTH_LANDSCAPE = 1000;
export const MQ_MAX_HEIGHT_LANDSCAPE = 500;

export const MAX_DECIMALS_FOR_SVG_EXPORT = 2;

export const DEFAULT_MAX_IMAGE_WIDTH_OR_HEIGHT = 1440;

export const MAX_ALLOWED_FILE_BYTES = 2 * 1024 * 1024;

export const SVG_NS = "http://www.w3.org/2000/svg";

export const ENCRYPTION_KEY_BITS = 128;

export const BOUND_TEXT_PADDING = 5;

export const ELEMENT_READY_TO_ERASE_OPACITY = 20;

// Radius represented as 25% of layer's largest side (width/height).
// Used for LEGACY and PROPORTIONAL_RADIUS algorithms, or when the layer is
// below the cutoff size.
export const DEFAULT_PROPORTIONAL_RADIUS = 0.25;
// Fixed radius for the ADAPTIVE_RADIUS algorithm. In pixels.
export const DEFAULT_ADAPTIVE_RADIUS = 32;
