import { setupStore } from "~/redux/store";

import { LOCAL_STORAGE_KEY, setTheme } from "./slice";

describe("preferencesListener", () => {
  it("adds a `data-theme` attribute to the `html` element", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setTheme("dark"));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("serializes state to localStorage", () => {
    const store = setupStore(undefined, true);
    store.dispatch(setTheme("dark"));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ theme: "dark" })
    );
  });
});
