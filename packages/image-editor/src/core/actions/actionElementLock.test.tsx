import { fireEvent, queryByTestId } from "@testing-library/react";

import { Excalidraw } from "../../lib/packages/excalidraw/index";
import { API } from "../tests/helpers/api";
import { Pointer, UI } from "../tests/helpers/ui";
import { render } from "../tests/test-utils";

const { h } = window;
const mouse = new Pointer("mouse");

describe("layer locking", () => {
  it("should not show unlockAllLayers action in contextMenu if no layers locked", async () => {
    await render(<Excalidraw />);

    mouse.rightClickAt(0, 0);

    const item = queryByTestId(UI.queryContextMenu()!, "unlockAllLayers");
    expect(item).not.toBeInTheDocument();
  });

  it("should unlock all layers and select them when using unlockAllLayers action in contextMenu", async () => {
    await render(
      <Excalidraw
        initialData={{
          layers: [
            API.createLayer({
              x: 100,
              y: 100,
              width: 100,
              height: 100,
              locked: true
            }),
            API.createLayer({
              x: 100,
              y: 100,
              width: 100,
              height: 100,
              locked: true
            }),
            API.createLayer({
              x: 100,
              y: 100,
              width: 100,
              height: 100,
              locked: false
            })
          ]
        }}
      />
    );

    mouse.rightClickAt(0, 0);

    expect(Object.keys(h.state.selectedLayerIds).length).toBe(0);
    expect(h.layers.map((el) => el.locked)).toEqual([true, true, false]);

    const item = queryByTestId(UI.queryContextMenu()!, "unlockAllLayers");
    expect(item).toBeInTheDocument();

    fireEvent.click(item!.querySelector("button")!);

    expect(h.layers.map((el) => el.locked)).toEqual([false, false, false]);
    // should select the unlocked layers
    expect(h.state.selectedLayerIds).toEqual({
      [h.layers[0].id]: true,
      [h.layers[1].id]: true
    });
  });
});
