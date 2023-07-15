import { Excalidraw } from "../../lib/packages/excalidraw/entry";
import { KEYS } from "../keys";
import { API } from "./helpers/api";
import { Keyboard } from "./helpers/ui";
import { fireEvent, render, waitFor } from "./test-utils";

describe("shortcuts", () => {
  it("Clear canvas shortcut should display confirm dialog", async () => {
    await render(
      <Excalidraw
        handleKeyboardGlobally
        initialData={{ layers: [API.createLayer({ type: "rectangle" })] }}
      />
    );

    expect(window.h.layers.length).toBe(1);

    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyDown(KEYS.DELETE);
    });
    const confirmDialog = document.querySelector(".confirm-dialog")!;
    expect(confirmDialog).not.toBe(null);

    fireEvent.click(confirmDialog.querySelector('[aria-label="Confirm"]')!);

    await waitFor(() => {
      expect(window.h.layers[0].isDeleted).toBe(true);
    });
  });
});
