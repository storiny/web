import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import { AppStartListening } from "../../listenerMiddleware";

export const LOCAL_STORAGE_KEY = "preferences";

// Schema to validate preferences stored in the browser (localStorage)
const preferencesSchema = z.object({
  theme: z.union([z.literal("system"), z.literal("light"), z.literal("dark")]),
  showAppearanceAlert: z.boolean(),
  showAccessibilityAlert: z.boolean(),
  readingFontSize: z.union([
    z.literal("slim"),
    z.literal("regular"),
    z.literal("oversized")
  ]),
  readingFont: z.union([
    z.literal("satoshi"),
    z.literal("system"),
    z.literal("nunito"),
    z.literal("synonym"),
    z.literal("lora"),
    z.literal("erode"),
    z.literal("recia"),
    z.literal("merriweather")
  ]),
  codeFont: z.union([
    z.literal("plex_mono"),
    z.literal("source_code_pro"),
    z.literal("system")
  ]),
  enableCodeLigatures: z.boolean()
});

export type PreferencesState = z.infer<typeof preferencesSchema>;
export type Theme = PreferencesState["theme"];

export const preferencesInitialState: PreferencesState = {
  theme: "system",
  showAppearanceAlert: true,
  showAccessibilityAlert: true,
  readingFont: "satoshi",
  readingFontSize: "regular",
  codeFont: "plex_mono",
  enableCodeLigatures: false
};

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState: preferencesInitialState,
  reducers: {
    /**
     * Sycns the theme to the browser
     */
    syncToBrowser: () => {},
    /**
     * Hydrates state from localStorage
     */
    hydrateState: (state, action: PayloadAction<PreferencesState>) =>
      action.payload,
    /**
     * Mutates the preferences
     */
    mutatePreferences: (
      state,
      action: PayloadAction<Partial<PreferencesState>>
    ) => {
      state = { ...state, ...action.payload };
      return state;
    },
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
  mutatePreferences,
  setAlertVisibility
} = preferencesSlice.actions;

export { mutatePreferences, setAlertVisibility, setTheme, syncToBrowser };

export const addPreferencesListeners = (
  startListening: AppStartListening
): void => {
  /**
   * Parse, validate and store the state from localStorage
   */
  startListening({
    actionCreator: syncToBrowser,
    effect: (action, listenerApi) => {
      try {
        const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (storedValue) {
          listenerApi.dispatch(
            hydrateState(preferencesSchema.parse(JSON.parse(storedValue)))
          );
        }
      } catch (e) {
        // noop
      }
    }
  });

  /**
   * Sync the `data-theme` attribute on the body element with the state
   */
  startListening({
    actionCreator: setTheme,
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
        } catch (e) {
          finalTheme = "light";
        }
      }

      document.documentElement.setAttribute("data-theme", finalTheme);
    }
  });

  /**
   * Persist the preferences state in the browser
   */
  startListening({
    matcher: isAnyOf(setTheme, setAlertVisibility, mutatePreferences),
    effect: (action, listenerApi) => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(listenerApi.getState().preferences)
        );
      } catch (e) {
        // noop
      }
    }
  });
};

export default preferencesSlice.reducer;
