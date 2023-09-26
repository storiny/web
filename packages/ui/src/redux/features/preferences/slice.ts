import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import { compressToUTF16, decompressFromUTF16 } from "lz-string";
import { z } from "zod";

import { AppStartListening } from "../../listenerMiddleware";

export const LOCAL_STORAGE_KEY = "preferences";

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
  theme: /*                          */ z
    .union([z.literal("system"), z.literal("light"), z.literal("dark")])
    .catch("system"),
  show_appearance_alert: /*          */ z.boolean().catch(true),
  show_accessibility_alert: /*       */ z.boolean().catch(true),
  show_font_settings_notification: /**/ z.boolean().catch(true),
  haptic_feedback: /*                */ z.boolean().catch(false),
  reduced_motion: /*                 */ z
    .union([z.literal("system"), z.literal("enabled"), z.literal("disabled")])
    .catch("system"),
  reading_font_size: /*              */ z
    .union([z.literal("slim"), z.literal("regular"), z.literal("oversized")])
    .catch("regular"),
  reading_font: /*                   */ z
    .union([
      z.literal("satoshi"),
      z.literal("system"),
      z.literal("nunito"),
      z.literal("synonym"),
      z.literal("lora"),
      z.literal("erode"),
      z.literal("recia"),
      z.literal("merriweather")
    ])
    .catch("satoshi"),
  code_font: /*                      */ z
    .union([
      z.literal("plex-mono"),
      z.literal("source-code-pro"),
      z.literal("system")
    ])
    .catch("system"),
  enable_code_ligatures: /*          */ z.boolean().catch(false)
});

export type PreferencesState = z.infer<typeof preferences_schema>;
export type Theme = PreferencesState["theme"];

export const preferencesInitialState: PreferencesState =
  get_defaults(preferences_schema);

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState: preferencesInitialState,
  reducers: {
    /**
     * Sycns the state to the browser
     */
    syncToBrowser: () => {},
    /**
     * Hydrates state from localStorage
     */
    hydrateState: (_, action: PayloadAction<PreferencesState>) =>
      action.payload,
    /**
     * Mutates alert visibility
     */
    setAlertVisibility: (
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
     * Mutates the font settings notification visibility
     */
    setFontSettingsNotificationVisibility: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state["show_font_settings_notification"] = action.payload;
    },
    /**
     * Changes the reduced motion settings
     */
    setReducedMotion: (
      state,
      action: PayloadAction<PreferencesState["reduced_motion"]>
    ) => {
      state.reduced_motion = action.payload;
    },
    /**
     * Changes the reading font size
     */
    setReadingFontSize: (
      state,
      action: PayloadAction<PreferencesState["reading_font_size"]>
    ) => {
      state.reading_font_size = action.payload;
    },
    /**
     * Changes the reading font
     */
    setReadingFont: (
      state,
      action: PayloadAction<PreferencesState["reading_font"]>
    ) => {
      state.reading_font = action.payload;
    },
    /**
     * Changes the code font
     */
    setCodeFont: (
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
    toggleCodeLigatures: (state, action: PayloadAction<boolean>) => {
      state.enable_code_ligatures = action.payload;
    },
    /**
     * Toggles haptic feeback
     */
    toggleHapticFeedback: (state, action: PayloadAction<boolean>) => {
      state.haptic_feedback = action.payload;
    },
    /**
     * Changes the theme
     */
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    }
  }
});

const {
  syncToBrowser,
  hydrateState,
  setTheme,
  setReducedMotion,
  setAlertVisibility,
  setReadingFont,
  setReadingFontSize,
  setCodeFont,
  toggleCodeLigatures,
  toggleHapticFeedback,
  setFontSettingsNotificationVisibility
} = preferencesSlice.actions;

export {
  hydrateState,
  setAlertVisibility,
  setCodeFont,
  setFontSettingsNotificationVisibility,
  setReadingFont,
  setReadingFontSize,
  setReducedMotion,
  setTheme,
  syncToBrowser,
  toggleCodeLigatures,
  toggleHapticFeedback
};

/**
 * Syncs the reading font to the browser
 * @param font Reading font
 */
const syncReadingFont = (font: PreferencesState["reading_font"]): void => {
  if (font !== "satoshi") {
    document.body.style.setProperty("--font-reading", `var(--font-${font})`);
  } else {
    document.body.style.removeProperty("--font-reading");
  }
};

/**
 * Syncs the reading font size to the browser
 * @param fontSize Reading font size
 */
const syncReadingFontSize = (
  fontSize: PreferencesState["reading_font_size"]
): void => {
  document.body.classList.remove(
    "t-legible-slim",
    "t-legible-regular",
    "t-legible-oversized"
  );
  document.body.classList.add(`t-legible-${fontSize}`);
};

/**
 * Syncs the code font to the browser
 * @param font Code font
 * @param ligatures Ligatures flag
 */
const syncCodeFont = (
  font: PreferencesState["code_font"],
  ligatures: boolean
): void => {
  document.body.classList.toggle("ligatures", ligatures);

  if (font !== "system") {
    document.body.style.setProperty(
      "--font-code",
      `var(--font-${font}${ligatures ? "-lig" : ""})`
    );
  } else {
    document.body.style.removeProperty("--font-code");
  }
};

export const addPreferencesListeners = (
  start_listening: AppStartListening
): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  start_listening({
    actionCreator: syncToBrowser,
    effect: (_, listener_api) => {
      try {
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedValue) {
          listener_api.dispatch(
            hydrateState(
              preferencesSchema.parse(
                JSON.parse(decompressFromUTF16(storedValue))
              )
            )
          );
        }
      } catch (e) {
        devConsole.error(e);
      }
    }
  });

  /**
   * Apply the hydrate state to the browser
   */
  start_listening({
    actionCreator: hydrateState,
    effect: (action) => {
      const state = action.payload;
      syncReadingFont(state.reading_font);
      syncReadingFontSize(state.reading_font_size);
      syncCodeFont(state.code_font, state.enable_code_ligatures);
    }
  });

  /**
   * Sync the `data-theme` attribute on the body element with the state
   */
  start_listening({
    matcher: isAnyOf(setTheme, hydrateState),
    effect: (_, listener_api) => {
      const { theme } = listener_api.getState().preferences;
      let finalTheme = theme;

      if (finalTheme === "system") {
        try {
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            finalTheme = "dark";
          } else {
            finalTheme = "light";
          }
        } catch {
          finalTheme = "light";
        }
      }

      document.documentElement.setAttribute("data-theme", finalTheme);
    }
  });

  /**
   * Sync reduced motion settings
   */
  start_listening({
    matcher: isAnyOf(setReducedMotion, hydrateState),
    effect: (_, listener_api) => {
      const { reduced_motion } = listener_api.getState().preferences;
      let finalReducedMotion = reduced_motion;

      if (reduced_motion === "system") {
        try {
          if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) {
            finalReducedMotion = "enabled";
          } else {
            finalReducedMotion = "disabled";
          }
        } catch {
          finalReducedMotion = "disabled";
        }
      }

      if (finalReducedMotion === "enabled") {
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
    actionCreator: setReadingFont,
    effect: (action) => syncReadingFont(action.payload)
  });

  /**
   * Sync the reading font size
   */
  start_listening({
    actionCreator: setReadingFontSize,
    effect: (action) => syncReadingFontSize(action.payload)
  });

  /**
   * Sync the code font
   */
  start_listening({
    matcher: isAnyOf(setCodeFont, toggleCodeLigatures),
    effect: (_, listener_api) => {
      const state = listener_api.getState();
      syncCodeFont(
        state.preferences.code_font,
        state.preferences.enable_code_ligatures
      );
    }
  });

  /**
   * Persist the preferences state in the browser
   */
  start_listening({
    matcher: isAnyOf(
      setTheme,
      setAlertVisibility,
      setReducedMotion,
      setCodeFont,
      setReadingFont,
      setReadingFontSize,
      toggleCodeLigatures,
      toggleHapticFeedback
    ),
    effect: (_, listener_api) => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          compressToUTF16(JSON.stringify(listener_api.getState().preferences))
        );
      } catch (e) {
        devConsole.error(e);
      }
    }
  });
};

export default preferencesSlice.reducer;
