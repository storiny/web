import { compressToUTF16 as compress_to_utf16 } from "lz-string";

import { setup_store } from "~/redux/store";

import {
  hydrate_state,
  LOCAL_STORAGE_KEY,
  preferences_initial_state,
  set_code_font,
  set_reading_font,
  set_reading_font_size,
  set_reduced_motion,
  set_theme,
  toggle_code_ligatures
} from "./slice";

describe("preferences_listener", () => {
  it("adds a `data-theme` attribute to the `html` element", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_theme("dark"));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("applies reduced motion settings to the `body`", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_reduced_motion("enabled"));

    expect(document.body).toHaveClass("reduced-motion");
  });

  it("`body` does not contain default reading font property", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(hydrate_state(preferences_initial_state));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-reading")
    ).toEqual("");
  });

  it("`body` does not contain default code font property", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(hydrate_state(preferences_initial_state));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-code")
    ).toEqual("");
  });

  it("applies reading font variable to the `body`", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_reading_font("synonym"));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-reading")
    ).toEqual("var(--font-synonym)");
  });

  it("applies reading font size class to the `body`", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_reading_font_size("slim"));

    expect(document.body).toHaveClass("t-legible-slim");
  });

  it("applies code font variable to the `body`", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_code_font("source-code-pro"));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-code")
    ).toEqual("var(--font-source-code-pro)");
  });

  it("applies code font variable with ligatures to the `body`", async () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_code_font("source-code-pro"));
    store.dispatch(toggle_code_ligatures(true));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-code")
    ).toEqual("var(--font-source-code-pro-lig)");
  });

  it("serializes state to localStorage", () => {
    const store = setup_store(undefined, true);
    store.dispatch(set_theme("dark"));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEY,
      compress_to_utf16(
        JSON.stringify({ ...preferences_initial_state, theme: "dark" })
      )
    );
  });
});
