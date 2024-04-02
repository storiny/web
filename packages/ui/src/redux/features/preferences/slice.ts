import {
  createSlice as create_slice,
  isAnyOf as is_any_of,
  PayloadAction
} from "@reduxjs/toolkit";
import { dev_console } from "@storiny/shared/src/utils/dev-log";
import {
  compressToUTF16 as compress_to_utf16,
  decompressFromUTF16 as decompress_from_utf16
} from "lz-string";
import { z } from "zod";

import css from "~/theme/main.module.scss";

import { AppStartListening } from "../../listener-middleware";

export const PREFERENCES_STORAGE_KEY = "preferences";
export const THEME_STORAGE_KEY = "theme";

/**
 * Resolves the system theme variant to binary theme value based on the
 * client's color scheme preference. Falls back to the `light` theme by
 * default.
 * @param theme The theme value.
 */
export const resolve_theme_value = (theme: Theme): Exclude<Theme, "system"> => {
  if (theme === "system") {
    try {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      } else {
        return "light";
      }
    } catch {
      return "light";
    }
  }

  return theme;
};

/**
 * Returns the defautl values of a schema
 * @param schema Schema
 */
const get_defaults = <Schema extends z.AnyZodObject>(
  schema: Schema
): PreferencesState =>
  Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodCatch) {
        return [
          key,
          value._def.catchValue({ error: new z.ZodError([]), input: "" })
        ];
      }

      return [key, undefined];
    })
  ) as PreferencesState;

// Schema to validate preferences stored in the browser (localStorage)
const preferences_schema = z.object({
  theme: z
    .union([z.literal("system"), z.literal("light"), z.literal("dark")])
    .catch("system"),
  resolved_theme: z
    .union([z.literal("light"), z.literal("dark")])
    .catch("dark"),
  show_appearance_alert: z.boolean().catch(true),
  show_accessibility_alert: z.boolean().catch(true),
  haptic_feedback: z.boolean().catch(false),
  reduced_motion: z
    .union([z.literal("system"), z.literal("enabled"), z.literal("disabled")])
    .catch("system"),
  reading_font_size: z
    .union([z.literal("slim"), z.literal("regular"), z.literal("oversized")])
    .catch("regular"),
  reading_font: z
    .union([
      z.literal("satoshi"),
      z.literal("system"),
      z.literal("nunito"),
      z.literal("synonym"),
      z.literal("lora"),
      z.literal("erode"),
      z.literal("recia"),
      z.literal("source-serif")
    ])
    .catch("satoshi"),
  code_font: z
    .union([
      z.literal("plex-mono"),
      z.literal("source-code-pro"),
      z.literal("system")
    ])
    .catch("system"),
  enable_code_ligatures: z.boolean().catch(false),
  enable_code_wrapping: z.boolean().catch(false),
  enable_code_gutters: z.boolean().catch(true)
});

export type PreferencesState = z.infer<typeof preferences_schema>;
export type Theme = PreferencesState["theme"];

export const preferences_initial_state: PreferencesState =
  get_defaults(preferences_schema);

export const preferences_slice = create_slice({
  name: "preferences",
  initialState: preferences_initial_state,
  reducers: {
    /**
     * Syncs the state to the browser
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sync_to_browser: (_, _action: PayloadAction<{ theme?: Theme }>) =>
      undefined,
    /**
     * Hydrates state from localStorage
     */
    hydrate_state: (_, action: PayloadAction<PreferencesState>) =>
      action.payload,
    /**
     * Mutates alert visibility
     */
    set_alert_visibility: (
      state,
      action: PayloadAction<["appearance" | "accessibility", boolean]>
    ) => {
      state[
        action.payload[0] === "appearance"
          ? "show_appearance_alert"
          : "show_accessibility_alert"
      ] = action.payload[1];
    },
    /**
     * Changes the reduced motion settings
     */
    set_reduced_motion: (
      state,
      action: PayloadAction<PreferencesState["reduced_motion"]>
    ) => {
      state.reduced_motion = action.payload;
    },
    /**
     * Changes the reading font size
     */
    set_reading_font_size: (
      state,
      action: PayloadAction<PreferencesState["reading_font_size"]>
    ) => {
      state.reading_font_size = action.payload;
    },
    /**
     * Changes the reading font
     */
    set_reading_font: (
      state,
      action: PayloadAction<PreferencesState["reading_font"]>
    ) => {
      state.reading_font = action.payload;
    },
    /**
     * Changes the code font
     */
    set_code_font: (
      state,
      action: PayloadAction<PreferencesState["code_font"]>
    ) => {
      if (action.payload === "system") {
        state.enable_code_ligatures = false; // Ligatures are not available with system font
      }

      state.code_font = action.payload;
    },
    /**
     * Toggles the code ligatures
     */
    toggle_code_ligatures: (state, action: PayloadAction<boolean>) => {
      state.enable_code_ligatures = action.payload;
    },
    /**
     * Toggles the code line wrapping
     */
    toggle_code_wrapping: (state, action: PayloadAction<boolean>) => {
      state.enable_code_wrapping = action.payload;
    },
    /**
     * Toggles the code gutters
     */
    toggle_code_gutters: (state, action: PayloadAction<boolean>) => {
      state.enable_code_gutters = action.payload;
    },
    /**
     * Toggles haptic feeback
     */
    toggle_haptic_feedback: (state, action: PayloadAction<boolean>) => {
      state.haptic_feedback = action.payload;
    },
    /**
     * Changes the theme
     */
    set_theme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      state.resolved_theme = resolve_theme_value(action.payload);
    }
  }
});

const {
  sync_to_browser,
  hydrate_state,
  set_theme,
  set_reduced_motion,
  set_alert_visibility,
  set_reading_font,
  set_reading_font_size,
  set_code_font,
  toggle_code_ligatures,
  toggle_code_wrapping,
  toggle_haptic_feedback,
  toggle_code_gutters
} = preferences_slice.actions;

export {
  hydrate_state,
  set_alert_visibility,
  set_code_font,
  set_reading_font,
  set_reading_font_size,
  set_reduced_motion,
  set_theme,
  sync_to_browser,
  toggle_code_gutters,
  toggle_code_ligatures,
  toggle_code_wrapping,
  toggle_haptic_feedback
};

/**
 * Syncs the reading font to the browser
 * @param font Reading font
 */
const sync_reading_font = (font: PreferencesState["reading_font"]): void => {
  if (font !== "satoshi") {
    document.body.style.setProperty("--font-reading", `var(--font-${font})`);
  } else {
    document.body.style.removeProperty("--font-reading");
  }
};

/**
 * Syncs the reading font size to the browser
 * @param font_size Reading font size
 */
const sync_reading_font_size = (
  font_size: PreferencesState["reading_font_size"]
): void => {
  document.body.classList.remove(
    css["t-legible-slim"],
    css["t-legible-regular"],
    css["t-legible-oversized"]
  );
  document.body.classList.add(css[`t-legible-${font_size}`]);
};

/**
 * Syncs the code font to the browser
 * @param font Code font
 * @param ligatures Ligatures flag
 */
const sync_code_font = (
  font: PreferencesState["code_font"],
  ligatures: boolean
): void => {
  document.body.classList.toggle(css["ligatures"], ligatures);

  if (font !== "system") {
    document.body.style.setProperty(
      "--font-code",
      `var(--font-${font}${ligatures ? "-lig" : ""})`
    );
  } else {
    document.body.style.removeProperty("--font-code");
  }
};

export const add_preferences_listeners = (
  start_listening: AppStartListening
): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  start_listening({
    actionCreator: sync_to_browser,
    effect: ({ payload }, listener_api) => {
      try {
        const theme_param = payload?.theme;
        const client_value = localStorage.getItem(PREFERENCES_STORAGE_KEY);

        let theme_value =
          typeof theme_param === "string"
            ? theme_param
            : localStorage.getItem(THEME_STORAGE_KEY);

        theme_value = ["light", "dark", "system"].includes(theme_value || "")
          ? (theme_value as "light" | "dark" | "system")
          : "system";

        if (client_value) {
          listener_api.dispatch(
            hydrate_state(
              preferences_schema.parse({
                ...JSON.parse(decompress_from_utf16(client_value)),
                theme: theme_value,
                resolved_theme: resolve_theme_value(
                  ["light", "dark"].includes(theme_value)
                    ? (theme_value as "light" | "dark")
                    : "system"
                )
              })
            )
          );
        } else {
          listener_api.dispatch(
            set_theme(theme_value as "light" | "dark" | "system")
          );
        }
      } catch (e) {
        dev_console.error(e);
      }
    }
  });

  /**
   * Apply the hydrated state to the browser
   */
  start_listening({
    actionCreator: hydrate_state,
    effect: (action) => {
      const state = action.payload;
      sync_reading_font(state.reading_font);
      sync_reading_font_size(state.reading_font_size);
      sync_code_font(state.code_font, state.enable_code_ligatures);
    }
  });

  /**
   * Sync the `data-theme` attribute on the body element with the state
   */
  start_listening({
    matcher: is_any_of(set_theme, hydrate_state),
    effect: (_, listener_api) => {
      const { theme } = listener_api.getState().preferences;
      const next_theme = resolve_theme_value(theme);
      document.documentElement.setAttribute("data-theme", next_theme);
    }
  });

  /**
   * Sync reduced motion settings
   */
  start_listening({
    matcher: is_any_of(set_reduced_motion, hydrate_state),
    effect: (_, listener_api) => {
      const { reduced_motion } = listener_api.getState().preferences;
      let next_reduced_motion = reduced_motion;

      if (reduced_motion === "system") {
        try {
          if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
            next_reduced_motion = "enabled";
          } else {
            next_reduced_motion = "disabled";
          }
        } catch {
          next_reduced_motion = "disabled";
        }
      }

      if (next_reduced_motion === "enabled") {
        if (!document.body.classList.contains("reduced-motion")) {
          document.body.classList.add("reduced-motion");
        }
      } else {
        document.body.classList.remove("reduced-motion");
      }
    }
  });

  /**
   * Sync the reading font
   */
  start_listening({
    actionCreator: set_reading_font,
    effect: (action) => sync_reading_font(action.payload)
  });

  /**
   * Sync the reading font size
   */
  start_listening({
    actionCreator: set_reading_font_size,
    effect: (action) => sync_reading_font_size(action.payload)
  });

  /**
   * Sync the code font
   */
  start_listening({
    matcher: is_any_of(set_code_font, toggle_code_ligatures),
    effect: (_, listener_api) => {
      const state = listener_api.getState();
      sync_code_font(
        state.preferences.code_font,
        state.preferences.enable_code_ligatures
      );
    }
  });

  /**
   * Persist the preferences state in the browser
   */
  start_listening({
    matcher: is_any_of(
      set_alert_visibility,
      set_reduced_motion,
      set_code_font,
      set_reading_font,
      set_reading_font_size,
      toggle_code_ligatures,
      toggle_code_wrapping,
      toggle_code_gutters,
      toggle_haptic_feedback
    ),
    effect: (_, listener_api) => {
      try {
        const serialized_state = compress_to_utf16(
          JSON.stringify({
            ...listener_api.getState().preferences,
            theme: undefined,
            resolved_theme: undefined
          })
        );
        localStorage.setItem(PREFERENCES_STORAGE_KEY, serialized_state);
      } catch (e) {
        dev_console.error(e);
      }
    }
  });

  /**
   * Persist the theme state in the browser
   */
  start_listening({
    actionCreator: set_theme,
    effect: (action) => {
      try {
        const theme = action.payload;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {
        dev_console.error(e);
      }
    }
  });
};

export default preferences_slice.reducer;
