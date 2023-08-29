import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import { z } from "zod";

import { AppStartListening } from "../../listenerMiddleware";

export const LOCAL_STORAGE_KEY = "preferences";

/**
 * Returns the defautl values of a schema
 * @param schema Schema
 */
const getDefaults = <Schema extends z.AnyZodObject>(
  schema: Schema
): PreferencesState =>
  Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault) {
        return [key, value._def.defaultValue()];
      }

      return [key, undefined];
    })
  ) as PreferencesState;

// Schema to validate preferences stored in the browser (localStorage)
const preferencesSchema = z.object({
  theme: z
    .union([z.literal("system"), z.literal("light"), z.literal("dark")])
    .default("system")
    .catch("system"),
  showAppearanceAlert: z.boolean().default(true).catch(true),
  showAccessibilityAlert: z.boolean().default(true).catch(true),
  hapticFeedback: z.boolean().default(false).catch(false),
  reducedMotion: z
    .union([z.literal("system"), z.literal("enabled"), z.literal("disabled")])
    .default("system")
    .catch("system"),
  readingFontSize: z
    .union([z.literal("slim"), z.literal("regular"), z.literal("oversized")])
    .default("regular")
    .catch("regular"),
  readingFont: z
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
    .default("satoshi")
    .catch("satoshi"),
  codeFont: z
    .union([
      z.literal("plex-mono"),
      z.literal("source-code-pro"),
      z.literal("system")
    ])
    .default("system")
    .catch("system"),
  enableCodeLigatures: z.boolean().default(false).catch(false)
});

export type PreferencesState = z.infer<typeof preferencesSchema>;
export type Theme = PreferencesState["theme"];

export const preferencesInitialState: PreferencesState =
  getDefaults(preferencesSchema);

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
          ? "showAppearanceAlert"
          : "showAccessibilityAlert"
      ] = action.payload[1];
    },
    /**
     * Changes the reduced motion settings
     */
    setReducedMotion: (
      state,
      action: PayloadAction<PreferencesState["reducedMotion"]>
    ) => {
      state.reducedMotion = action.payload;
    },
    /**
     * Changes the reading font size
     */
    setReadingFontSize: (
      state,
      action: PayloadAction<PreferencesState["readingFontSize"]>
    ) => {
      state.readingFontSize = action.payload;
    },
    /**
     * Changes the reading font
     */
    setReadingFont: (
      state,
      action: PayloadAction<PreferencesState["readingFont"]>
    ) => {
      state.readingFont = action.payload;
    },
    /**
     * Changes the code font
     */
    setCodeFont: (
      state,
      action: PayloadAction<PreferencesState["codeFont"]>
    ) => {
      if (action.payload === "system") {
        state.enableCodeLigatures = false; // Ligatures are not available with system font
      }

      state.codeFont = action.payload;
    },
    /**
     * Toggles the code ligatures
     */
    toggleCodeLigatures: (state, action: PayloadAction<boolean>) => {
      state.enableCodeLigatures = action.payload;
    },
    /**
     * Toggles haptic feeback
     */
    toggleHapticFeedback: (state, action: PayloadAction<boolean>) => {
      state.hapticFeedback = action.payload;
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
  toggleHapticFeedback
} = preferencesSlice.actions;

export {
  hydrateState,
  setAlertVisibility,
  setCodeFont,
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
const syncReadingFont = (font: PreferencesState["readingFont"]): void => {
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
  fontSize: PreferencesState["readingFontSize"]
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
  font: PreferencesState["codeFont"],
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
  startListening: AppStartListening
): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  startListening({
    actionCreator: syncToBrowser,
    effect: (_, listenerApi) => {
      try {
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedValue) {
          listenerApi.dispatch(
            hydrateState(preferencesSchema.parse(JSON.parse(storedValue)))
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
  startListening({
    actionCreator: hydrateState,
    effect: (action) => {
      const state = action.payload;
      syncReadingFont(state.readingFont);
      syncReadingFontSize(state.readingFontSize);
      syncCodeFont(state.codeFont, state.enableCodeLigatures);
    }
  });

  /**
   * Sync the `data-theme` attribute on the body element with the state
   */
  startListening({
    matcher: isAnyOf(setTheme, hydrateState),
    effect: (_, listenerApi) => {
      const { theme } = listenerApi.getState().preferences;
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
  startListening({
    matcher: isAnyOf(setReducedMotion, hydrateState),
    effect: (_, listenerApi) => {
      const { reducedMotion } = listenerApi.getState().preferences;
      let finalReducedMotion = reducedMotion;

      if (reducedMotion === "system") {
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
  startListening({
    actionCreator: setReadingFont,
    effect: (action) => syncReadingFont(action.payload)
  });

  /**
   * Sync the reading font size
   */
  startListening({
    actionCreator: setReadingFontSize,
    effect: (action) => syncReadingFontSize(action.payload)
  });

  /**
   * Sync the code font
   */
  startListening({
    matcher: isAnyOf(setCodeFont, toggleCodeLigatures),
    effect: (_, listenerApi) => {
      const state = listenerApi.getState();
      syncCodeFont(
        state.preferences.codeFont,
        state.preferences.enableCodeLigatures
      );
    }
  });

  /**
   * Persist the preferences state in the browser
   */
  startListening({
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
    effect: (_, listenerApi) => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(listenerApi.getState().preferences)
        );
      } catch (e) {
        devConsole.error(e);
      }
    }
  });
};

export default preferencesSlice.reducer;
