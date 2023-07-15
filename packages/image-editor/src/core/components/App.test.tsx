import ReactDOM from "react-dom";

import ExcalidrawApp from "../excalidraw-app";
import { reseed } from "../random";
import * as Renderer from "../renderer/renderScene";
import { queryByTestId, render } from "../tests/test-utils";

const renderScene = jest.spyOn(Renderer, "renderScene");

describe("Test <App/>", () => {
  beforeEach(async () => {
    // Unmount ReactDOM from root
    ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);
    localStorage.clear();
    renderScene.mockClear();
    reseed(7);
  });

  it("should show error modal when using brave and measureText API is not working", async () => {
    (global.navigator as any).brave = {
      isBrave: {
        name: "isBrave"
      }
    };

    const originalContext = global.HTMLCanvasLayer.prototype.getContext("2d");
    //@ts-ignore
    global.HTMLCanvasLayer.prototype.getContext = (contextId) => {
      return {
        ...originalContext,
        measureText: () => ({
          width: 0
        })
      };
    };

    await render(<ExcalidrawApp />);
    expect(
      queryByTestId(
        document.querySelector(".excalidraw-modal-container")!,
        "brave-measure-text-error"
      )
    ).toMatchSnapshot();
  });
});
