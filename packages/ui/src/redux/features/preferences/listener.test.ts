import { compressToUTF16 } from "lz-string";

import { setupStore } from "~/redux/store";

import {
  hydrateState,
  LOCAL_STORAGE_KEY,
  preferencesInitialState,
  setCodeFont,
  setReadingFont,
  setReadingFontSize,
  setReducedMotion,
  setTheme,
  toggleCodeLigatures
} from "./slice";

describe("preferencesListener", () => {
  it("adds a `data-theme` attribute to the `html` element", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(setTheme("dark"));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("applies reduced motion settings to the `body`", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(setReducedMotion("enabled"));

    expect(document.body).toHaveClass("reduced-motion");
  });

  it("`body` does not contain default reading font property", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(hydrateState(preferencesInitialState));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-reading")
    ).toEqual("");
  });

  it("`body` does not contain default code font property", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(hydrateState(preferencesInitialState));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-code")
    ).toEqual("");
  });

  it("applies reading font variable to the `body`", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(setReadingFont("synonym"));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-reading")
    ).toEqual("var(--font-synonym)");
  });

  it("applies reading font size class to the `body`", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(setReadingFontSize("slim"));

    expect(document.body).toHaveClass("t-legible-slim");
  });

  it("applies code font variable to the `body`", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(setCodeFont("source-code-pro"));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-code")
    ).toEqual("var(--font-source-code-pro)");
  });

  it("applies code font variable with ligatures to the `body`", async () => {
    const store = setupStore(undefined, true);
    store.dispatch(setCodeFont("source-code-pro"));
    store.dispatch(toggleCodeLigatures(true));

    expect(
      getComputedStyle(document.body).getPropertyValue("--font-code")
    ).toEqual("var(--font-source-code-pro-lig)");
  });

  it("serializes state to localStorage", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setTheme("dark"));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEY,
      compressToUTF16(
        JSON.stringify({ ...preferencesInitialState, theme: "dark" })
      )
    );
  });
});
