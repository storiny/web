import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import { AppStartListening } from "../../listenerMiddleware";

export const LOCAL_STORAGE_KEY = "preferences";

// Schema to validate preferences stored in the browser (localStorage).
const preferencesSchema = z.object({
  theme: z.union([z.literal("system"), z.literal("light"), z.literal("dark")])
});

export type PreferencesState = z.infer<typeof preferencesSchema>;
export type Theme = PreferencesState["theme"];

export const preferencesInitialState: PreferencesState = { theme: "system" };

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState: preferencesInitialState,
  reducers: {
    syncToBrowser: () => {},
    hydrateState: (state, action: PayloadAction<PreferencesState>) =>
      action.payload,
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    }
  }
});

const { syncToBrowser, hydrateState, setTheme } = preferencesSlice.actions;

export { setTheme, syncToBrowser };

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
   * Sync the `data-theme` attribute on body element with the state
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
    matcher: isAnyOf(setTheme),
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
