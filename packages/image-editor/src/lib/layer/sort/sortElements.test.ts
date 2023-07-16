import { API } from "../tests/helpers/api";
import { mutateLayer } from "./mutateLayer";
import { normalizeLayerOrder } from "./sortLayers";
import { ExcalidrawLayer } from "./types";

const assertOrder = (
  layers: readonly ExcalidrawLayer[],
  expectedOrder: string[]
) => {
  const actualOrder = layers.map((layer) => layer.id);
  expect(actualOrder).toEqual(expectedOrder);
};

describe("normalizeLayersOrder", () => {
  it("sort bound-text layers", () => {
    const container = API.createLayer({
      id: "container",
      type: "rectangle"
    });
    const boundText = API.createLayer({
      id: "boundText",
      type: "text",
      containerId: container.id
    });
    const otherLayer = API.createLayer({
      id: "otherLayer",
      type: "rectangle",
      boundLayers: []
    });
    const otherLayer2 = API.createLayer({
      id: "otherLayer2",
      type: "rectangle",
      boundLayers: []
    });

    mutateLayer(container, {
      boundLayers: [{ type: "text", id: boundText.id }]
    });

    assertOrder(normalizeLayerOrder([container, boundText]), [
      "container",
      "boundText"
    ]);
    assertOrder(normalizeLayerOrder([boundText, container]), [
      "container",
      "boundText"
    ]);
    assertOrder(
      normalizeLayerOrder([boundText, container, otherLayer, otherLayer2]),
      ["container", "boundText", "otherLayer", "otherLayer2"]
    );
    assertOrder(normalizeLayerOrder([container, otherLayer, boundText]), [
      "container",
      "boundText",
      "otherLayer"
    ]);
    assertOrder(
      normalizeLayerOrder([container, otherLayer, otherLayer2, boundText]),
      ["container", "boundText", "otherLayer", "otherLayer2"]
    );

    assertOrder(
      normalizeLayerOrder([boundText, otherLayer, container, otherLayer2]),
      ["otherLayer", "container", "boundText", "otherLayer2"]
    );

    // noop
    assertOrder(
      normalizeLayerOrder([otherLayer, container, boundText, otherLayer2]),
      ["otherLayer", "container", "boundText", "otherLayer2"]
    );

    // text has existing containerId, but container doesn't list is
    // as a boundLayer
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "boundText",
          type: "text",
          containerId: "container"
        }),
        API.createLayer({
          id: "container",
          type: "rectangle"
        })
      ]),
      ["boundText", "container"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "boundText",
          type: "text",
          containerId: "container"
        })
      ]),
      ["boundText"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "container",
          type: "rectangle",
          boundLayers: []
        })
      ]),
      ["container"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "container",
          type: "rectangle",
          boundLayers: [{ id: "x", type: "text" }]
        })
      ]),
      ["container"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "arrow",
          type: "arrow"
        }),
        API.createLayer({
          id: "container",
          type: "rectangle",
          boundLayers: [{ id: "arrow", type: "arrow" }]
        })
      ]),
      ["arrow", "container"]
    );
  });

  it("normalize group order", () => {
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "A_rect1",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "rect2",
          type: "rectangle"
        }),
        API.createLayer({
          id: "rect3",
          type: "rectangle"
        }),
        API.createLayer({
          id: "A_rect4",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "A_rect5",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "rect6",
          type: "rectangle"
        }),
        API.createLayer({
          id: "A_rect7",
          type: "rectangle",
          groupIds: ["A"]
        })
      ]),
      ["A_rect1", "A_rect4", "A_rect5", "A_rect7", "rect2", "rect3", "rect6"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "A_rect1",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "rect2",
          type: "rectangle"
        }),
        API.createLayer({
          id: "B_rect3",
          type: "rectangle",
          groupIds: ["B"]
        }),
        API.createLayer({
          id: "A_rect4",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "B_rect5",
          type: "rectangle",
          groupIds: ["B"]
        }),
        API.createLayer({
          id: "rect6",
          type: "rectangle"
        }),
        API.createLayer({
          id: "A_rect7",
          type: "rectangle",
          groupIds: ["A"]
        })
      ]),
      ["A_rect1", "A_rect4", "A_rect7", "rect2", "B_rect3", "B_rect5", "rect6"]
    );
    // nested groups
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "A_rect1",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "BA_rect2",
          type: "rectangle",
          groupIds: ["B", "A"]
        })
      ]),
      ["A_rect1", "BA_rect2"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "BA_rect1",
          type: "rectangle",
          groupIds: ["B", "A"]
        }),
        API.createLayer({
          id: "A_rect2",
          type: "rectangle",
          groupIds: ["A"]
        })
      ]),
      ["BA_rect1", "A_rect2"]
    );
    assertOrder(
      normalizeLayerOrder([
        API.createLayer({
          id: "BA_rect1",
          type: "rectangle",
          groupIds: ["B", "A"]
        }),
        API.createLayer({
          id: "A_rect2",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "CBA_rect3",
          type: "rectangle",
          groupIds: ["C", "B", "A"]
        }),
        API.createLayer({
          id: "rect4",
          type: "rectangle"
        }),
        API.createLayer({
          id: "A_rect5",
          type: "rectangle",
          groupIds: ["A"]
        }),
        API.createLayer({
          id: "BA_rect5",
          type: "rectangle",
          groupIds: ["B", "A"]
        }),
        API.createLayer({
          id: "BA_rect6",
          type: "rectangle",
          groupIds: ["B", "A"]
        }),
        API.createLayer({
          id: "CBA_rect7",
          type: "rectangle",
          groupIds: ["C", "B", "A"]
        }),
        API.createLayer({
          id: "X_rect8",
          type: "rectangle",
          groupIds: ["X"]
        }),
        API.createLayer({
          id: "rect9",
          type: "rectangle"
        }),
        API.createLayer({
          id: "YX_rect10",
          type: "rectangle",
          groupIds: ["Y", "X"]
        }),
        API.createLayer({
          id: "X_rect11",
          type: "rectangle",
          groupIds: ["X"]
        })
      ]),
      [
        "BA_rect1",
        "BA_rect5",
        "BA_rect6",
        "A_rect2",
        "A_rect5",
        "CBA_rect3",
        "CBA_rect7",
        "rect4",
        "X_rect8",
        "X_rect11",
        "YX_rect10",
        "rect9"
      ]
    );
  });

  // TODO
  it.skip("normalize boundLayers array", () => {
    const container = API.createLayer({
      id: "container",
      type: "rectangle",
      boundLayers: []
    });
    const boundText = API.createLayer({
      id: "boundText",
      type: "text",
      containerId: container.id
    });

    mutateLayer(container, {
      boundLayers: [
        { type: "text", id: boundText.id },
        { type: "text", id: "xxx" }
      ]
    });

    expect(normalizeLayerOrder([container, boundText])).toEqual([
      expect.objectContaining({
        id: container.id
      }),
      expect.objectContaining({ id: boundText.id })
    ]);
  });

  // should take around <100ms for 10K iterations (@dwelle's PC 22-05-25)
  it.skip("normalizeLayersOrder() perf", () => {
    const makeLayers = (iterations: number) => {
      const layers: ExcalidrawLayer[] = [];
      while (iterations--) {
        const container = API.createLayer({
          type: "rectangle",
          boundLayers: [],
          groupIds: ["B", "A"]
        });
        const boundText = API.createLayer({
          type: "text",
          containerId: container.id,
          groupIds: ["A"]
        });
        const otherLayer = API.createLayer({
          type: "rectangle",
          boundLayers: [],
          groupIds: ["C", "A"]
        });
        mutateLayer(container, {
          boundLayers: [{ type: "text", id: boundText.id }]
        });

        layers.push(boundText, otherLayer, container);
      }
      return layers;
    };

    const layers = makeLayers(10000);
    const t0 = Date.now();
    normalizeLayerOrder(layers);
    console.info(`${Date.now() - t0}ms`);
  });
});
