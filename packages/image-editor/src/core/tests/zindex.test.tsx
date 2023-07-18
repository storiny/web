import ReactDOM from "react-dom";

import {
  actionBringForward,
  actionBringToFront,
  actionDuplicateSelection,
  actionSendBackward,
  actionSendToBack
} from "../actions";
import ExcalidrawApp from "../excalidraw-app";
import { selectGroupsForSelectedLayers } from "../groups";
import { reseed } from "../random";
import { AppState } from "../types";
import { API } from "./helpers/api";
import { render } from "./test-utils";

// Unmount ReactDOM from root
ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);

beforeEach(() => {
  localStorage.clear();
  reseed(7);
});

const { h } = window;

const populateLayers = (
  layers: {
    containerId?: string;
    groupIds?: string[];
    height?: number;
    id: string;
    isDeleted?: boolean;
    isSelected?: boolean;
    width?: number;
    x?: number;
    y?: number;
  }[],
  editorState?: Partial<AppState>
) => {
  const selectedLayerIds: any = {};

  const newLayers = layers.map(
    ({
      id,
      isDeleted = false,
      isSelected = false,
      groupIds = [],
      y = 100,
      x = 100,
      width = 100,
      height = 100,
      containerId = null
    }) => {
      const layer = API.createLayer({
        type: containerId ? "text" : "rectangle",
        id,
        isDeleted,
        x,
        y,
        width,
        height,
        groupIds,
        containerId
      });
      if (isSelected) {
        selectedLayerIds[layer.id] = true;
      }
      return layer;
    }
  );

  // initialize `boundLayers` on containers, if applicable
  h.layers = newLayers.map((layer, index, layers) => {
    const nextLayer = layers[index + 1];
    if (
      nextLayer &&
      "containerId" in nextLayer &&
      layer.id === nextLayer.containerId
    ) {
      return {
        ...layer,
        boundLayers: [{ type: "text", id: nextLayer.id }]
      };
    }
    return layer;
  });

  h.setState({
    ...selectGroupsForSelectedLayers(
      { ...h.state, ...editorState, selectedLayerIds },
      h.layers,
      h.state
    ),
    ...editorState,
    selectedLayerIds
  });

  return selectedLayerIds;
};

type Actions =
  | typeof actionBringForward
  | typeof actionSendBackward
  | typeof actionBringToFront
  | typeof actionSendToBack;

const assertZindex = ({
  layers,
  editorState,
  operations
}: {
  editorState?: Partial<AppState>;
  layers: {
    containerId?: string;
    groupIds?: string[];
    id: string;
    isDeleted?: true;
    isSelected?: true;
  }[];
  operations: [Actions, string[]][];
}) => {
  const selectedLayerIds = populateLayers(layers, editorState);

  operations.forEach(([action, expected]) => {
    h.app.actionManager.executeAction(action);
    expect(h.layers.map((layer) => layer.id)).toEqual(expected);
    expect(h.state.selectedLayerIds).toEqual(selectedLayerIds);
  });
};

describe("z-index manipulation", () => {
  beforeEach(async () => {
    await render(<ExcalidrawApp />);
  });

  it("send back", () => {
    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true }
      ],
      operations: [
        [actionSendBackward, ["D", "A", "B", "C"]],
        // noop
        [actionSendBackward, ["D", "A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true }
      ],
      operations: [
        // noop
        [actionSendBackward, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isDeleted: true },
        { id: "B" },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true }
      ],
      operations: [[actionSendBackward, ["A", "D", "B", "C"]]]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true },
        { id: "E", isSelected: true },
        { id: "F" }
      ],
      operations: [
        [actionSendBackward, ["D", "E", "A", "B", "C", "F"]],
        // noop
        [actionSendBackward, ["D", "E", "A", "B", "C", "F"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B" },
        { id: "C", isDeleted: true },
        { id: "D", isDeleted: true },
        { id: "E", isSelected: true },
        { id: "F" },
        { id: "G", isSelected: true }
      ],
      operations: [
        [actionSendBackward, ["A", "E", "B", "C", "D", "G", "F"]],
        [actionSendBackward, ["E", "A", "G", "B", "C", "D", "F"]],
        [actionSendBackward, ["E", "G", "A", "B", "C", "D", "F"]],
        // noop
        [actionSendBackward, ["E", "G", "A", "B", "C", "D", "F"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B" },
        { id: "C", isDeleted: true },
        { id: "D", isSelected: true },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true },
        { id: "G" }
      ],
      operations: [
        [actionSendBackward, ["A", "D", "E", "F", "B", "C", "G"]],
        [actionSendBackward, ["D", "E", "F", "A", "B", "C", "G"]],
        // noop
        [actionSendBackward, ["D", "E", "F", "A", "B", "C", "G"]]
      ]
    });

    // grouped layers should be atomic
    // -------------------------------------------------------------------------

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g1"] },
        { id: "D", isDeleted: true },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true }
      ],
      operations: [
        [actionSendBackward, ["A", "F", "B", "C", "D", "E"]],
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
        // noop
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g1"] },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true }
      ],
      operations: [
        [actionSendBackward, ["A", "F", "B", "C", "D", "E"]],
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
        // noop
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", isDeleted: true },
        { id: "F", isSelected: true }
      ],
      operations: [
        [actionSendBackward, ["A", "F", "B", "C", "D", "E"]],
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]],
        // noop
        [actionSendBackward, ["F", "A", "B", "C", "D", "E"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B1", groupIds: ["g1"] },
        { id: "C1", groupIds: ["g1"] },
        { id: "D2", groupIds: ["g2"], isSelected: true },
        { id: "E2", groupIds: ["g2"], isSelected: true }
      ],
      editorState: {
        editingGroupId: null
      },
      operations: [[actionSendBackward, ["A", "D2", "E2", "B1", "C1"]]]
    });

    // in-group siblings
    // -------------------------------------------------------------------------

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionSendBackward, ["A", "B", "D", "C"]],
        // noop (prevented)
        [actionSendBackward, ["A", "B", "D", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g1"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionSendBackward, ["A", "D", "B", "C"]],
        // noop (prevented)
        [actionSendBackward, ["A", "D", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"], isSelected: true },
        { id: "D", groupIds: ["g2", "g1"], isDeleted: true },
        { id: "E", groupIds: ["g2", "g1"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionSendBackward, ["A", "C", "D", "E", "B"]],
        // noop (prevented)
        [actionSendBackward, ["A", "C", "D", "E", "B"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", groupIds: ["g3", "g1"], isSelected: true },
        { id: "F", groupIds: ["g3", "g1"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionSendBackward, ["A", "B", "E", "F", "C", "D"]],
        [actionSendBackward, ["A", "E", "F", "B", "C", "D"]],
        // noop (prevented)
        [actionSendBackward, ["A", "E", "F", "B", "C", "D"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1"] },
        { id: "B", groupIds: ["g2"] },
        { id: "C", groupIds: ["g1"] },
        { id: "D", groupIds: ["g2"], isSelected: true },
        { id: "E", groupIds: ["g2"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionSendBackward, ["A", "D", "E", "B", "C"]],
        // noop
        [actionSendBackward, ["A", "D", "E", "B", "C"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1"] },
        { id: "B", groupIds: ["g2"] },
        { id: "C", groupIds: ["g1"] },
        { id: "D", groupIds: ["g2"], isSelected: true },
        { id: "F" },
        { id: "G", groupIds: ["g2"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionSendBackward, ["A", "D", "G", "B", "C", "F"]],
        // noop
        [actionSendBackward, ["A", "D", "G", "B", "C", "F"]]
      ]
    });
  });

  it("bring forward", () => {
    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true },
        { id: "D", isDeleted: true },
        { id: "E" }
      ],
      operations: [
        [actionBringForward, ["A", "D", "E", "B", "C"]],
        // noop
        [actionBringForward, ["A", "D", "E", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true }
      ],
      operations: [
        // noop
        [actionBringForward, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D" },
        { id: "E", isSelected: true },
        { id: "F", isDeleted: true },
        { id: "G" }
      ],
      operations: [
        [actionBringForward, ["B", "C", "D", "A", "F", "G", "E"]],
        [actionBringForward, ["B", "C", "D", "F", "G", "A", "E"]],
        // noop
        [actionBringForward, ["B", "C", "D", "F", "G", "A", "E"]]
      ]
    });

    // grouped layers should be atomic
    // -------------------------------------------------------------------------

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D", groupIds: ["g1"] },
        { id: "E", groupIds: ["g1"] },
        { id: "F" }
      ],
      operations: [
        [actionBringForward, ["B", "C", "D", "E", "A", "F"]],
        [actionBringForward, ["B", "C", "D", "E", "F", "A"]],
        // noop
        [actionBringForward, ["B", "C", "D", "E", "F", "A"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", groupIds: ["g1"] },
        { id: "F" }
      ],
      operations: [
        [actionBringForward, ["A", "C", "D", "E", "B", "F"]],
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]],
        // noop
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", groupIds: ["g1"] },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "E", groupIds: ["g2", "g1"] },
        { id: "F" }
      ],
      operations: [
        [actionBringForward, ["A", "C", "D", "E", "B", "F"]],
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]],
        // noop
        [actionBringForward, ["A", "C", "D", "E", "F", "B"]]
      ]
    });

    // in-group siblings
    // -------------------------------------------------------------------------

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"], isSelected: true },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionBringForward, ["A", "C", "B", "D"]],
        // noop (prevented)
        [actionBringForward, ["A", "C", "B", "D"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1"], isSelected: true },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D" }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionBringForward, ["B", "C", "A", "D"]],
        // noop (prevented)
        [actionBringForward, ["B", "C", "A", "D"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", groupIds: ["g2", "g1"], isSelected: true },
        { id: "B", groupIds: ["g2", "g1"], isSelected: true },
        { id: "C", groupIds: ["g1"] },
        { id: "D" }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionBringForward, ["C", "A", "B", "D"]],
        // noop (prevented)
        [actionBringForward, ["C", "A", "B", "D"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g2"], isSelected: true },
        { id: "B", groupIds: ["g2"], isSelected: true },
        { id: "C", groupIds: ["g1"] },
        { id: "D", groupIds: ["g2"] },
        { id: "E", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionBringForward, ["C", "D", "A", "B", "E"]],
        // noop
        [actionBringForward, ["C", "D", "A", "B", "E"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g2"], isSelected: true },
        { id: "B" },
        { id: "C", groupIds: ["g2"], isSelected: true },
        { id: "D", groupIds: ["g1"] },
        { id: "E", groupIds: ["g2"] },
        { id: "F", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionBringForward, ["B", "D", "E", "A", "C", "F"]],
        // noop
        [actionBringForward, ["B", "D", "E", "A", "C", "F"]]
      ]
    });
  });

  it("bring to front", () => {
    assertZindex({
      layers: [
        { id: "0" },
        { id: "A", isSelected: true },
        { id: "B", isDeleted: true },
        { id: "C", isDeleted: true },
        { id: "D" },
        { id: "E", isSelected: true },
        { id: "F", isDeleted: true },
        { id: "G" }
      ],
      operations: [
        [actionBringToFront, ["0", "B", "C", "D", "F", "G", "A", "E"]],
        // noop
        [actionBringToFront, ["0", "B", "C", "D", "F", "G", "A", "E"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true }
      ],
      operations: [
        // noop
        [actionBringToFront, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true }
      ],
      operations: [
        // noop
        [actionBringToFront, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C" }
      ],
      operations: [
        [actionBringToFront, ["C", "A", "B"]],
        // noop
        [actionBringToFront, ["C", "A", "B"]]
      ]
    });

    // in-group sorting
    // -------------------------------------------------------------------------

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g1"], isSelected: true },
        { id: "D", groupIds: ["g1"] },
        { id: "E", groupIds: ["g1"], isSelected: true },
        { id: "F", groupIds: ["g2", "g1"] },
        { id: "G", groupIds: ["g2", "g1"] },
        { id: "H", groupIds: ["g3", "g1"] },
        { id: "I", groupIds: ["g3", "g1"] }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionBringToFront, ["A", "B", "D", "F", "G", "H", "I", "C", "E"]],
        // noop (prevented)
        [actionBringToFront, ["A", "B", "D", "F", "G", "H", "I", "C", "E"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"], isSelected: true },
        { id: "D", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionBringToFront, ["A", "D", "B", "C"]],
        // noop (prevented)
        [actionBringToFront, ["A", "D", "B", "C"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g2", "g3"], isSelected: true },
        { id: "B", groupIds: ["g1", "g3"] },
        { id: "C", groupIds: ["g2", "g3"] },
        { id: "D", groupIds: ["g1", "g3"] }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionBringToFront, ["B", "C", "A", "D"]],
        // noop
        [actionBringToFront, ["B", "C", "A", "D"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g2"], isSelected: true },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2"] },
        { id: "D", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionBringToFront, ["B", "C", "A", "D"]],
        // noop
        [actionBringToFront, ["B", "C", "A", "D"]]
      ]
    });
  });

  it("send to back", () => {
    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isDeleted: true },
        { id: "C" },
        { id: "D", isDeleted: true },
        { id: "E", isSelected: true },
        { id: "F", isDeleted: true },
        { id: "G" },
        { id: "H", isSelected: true },
        { id: "I" }
      ],
      operations: [
        [actionSendToBack, ["E", "H", "A", "B", "C", "D", "F", "G", "I"]],
        // noop
        [actionSendToBack, ["E", "H", "A", "B", "C", "D", "F", "G", "I"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true }
      ],
      operations: [
        // noop
        [actionSendToBack, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B", isSelected: true },
        { id: "C" }
      ],
      operations: [
        // noop
        [actionSendToBack, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", isSelected: true }
      ],
      operations: [
        [actionSendToBack, ["B", "C", "A"]],
        // noop
        [actionSendToBack, ["B", "C", "A"]]
      ]
    });

    // in-group sorting
    // -------------------------------------------------------------------------

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g2", "g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g3", "g1"] },
        { id: "E", groupIds: ["g3", "g1"] },
        { id: "F", groupIds: ["g1"], isSelected: true },
        { id: "G", groupIds: ["g1"] },
        { id: "H", groupIds: ["g1"], isSelected: true },
        { id: "I", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionSendToBack, ["A", "F", "H", "B", "C", "D", "E", "G", "I"]],
        // noop (prevented)
        [actionSendToBack, ["A", "F", "H", "B", "C", "D", "E", "G", "I"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", groupIds: ["g1"] },
        { id: "C", groupIds: ["g2", "g1"] },
        { id: "D", groupIds: ["g2", "g1"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionSendToBack, ["A", "B", "D", "C"]],
        // noop (prevented)
        [actionSendToBack, ["A", "B", "D", "C"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1", "g3"] },
        { id: "B", groupIds: ["g2", "g3"] },
        { id: "C", groupIds: ["g1", "g3"] },
        { id: "D", groupIds: ["g2", "g3"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionSendToBack, ["A", "D", "B", "C"]],
        // noop
        [actionSendToBack, ["A", "D", "B", "C"]]
      ]
    });

    // invalid z-indexes across groups (legacy) → allow to sort to next sibling
    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1"] },
        { id: "B", groupIds: ["g2"] },
        { id: "C", groupIds: ["g1"] },
        { id: "D", groupIds: ["g2"], isSelected: true }
      ],
      editorState: {
        editingGroupId: "g2"
      },
      operations: [
        [actionSendToBack, ["A", "D", "B", "C"]],
        // noop
        [actionSendToBack, ["A", "D", "B", "C"]]
      ]
    });
  });

  it("duplicating layers should retain zindex integrity", () => {
    populateLayers([
      { id: "A", isSelected: true },
      { id: "B", isSelected: true }
    ]);
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers).toMatchObject([
      { id: "A" },
      { id: "A_copy" },
      { id: "B" },
      { id: "B_copy" }
    ]);

    populateLayers([
      { id: "A", groupIds: ["g1"], isSelected: true },
      { id: "B", groupIds: ["g1"], isSelected: true }
    ]);
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers).toMatchObject([
      { id: "A" },
      { id: "B" },
      {
        id: "A_copy",

        groupIds: [expect.stringMatching(/.{3,}/)]
      },
      {
        id: "B_copy",

        groupIds: [expect.stringMatching(/.{3,}/)]
      }
    ]);

    populateLayers([
      { id: "A", groupIds: ["g1"], isSelected: true },
      { id: "B", groupIds: ["g1"], isSelected: true },
      { id: "C" }
    ]);
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers).toMatchObject([
      { id: "A" },
      { id: "B" },
      {
        id: "A_copy",

        groupIds: [expect.stringMatching(/.{3,}/)]
      },
      {
        id: "B_copy",

        groupIds: [expect.stringMatching(/.{3,}/)]
      },
      { id: "C" }
    ]);

    populateLayers([
      { id: "A", groupIds: ["g1"], isSelected: true },
      { id: "B", groupIds: ["g1"], isSelected: true },
      { id: "C", isSelected: true }
    ]);
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "A_copy",
      "B_copy",
      "C",
      "C_copy"
    ]);

    populateLayers([
      { id: "A", groupIds: ["g1"], isSelected: true },
      { id: "B", groupIds: ["g1"], isSelected: true },
      { id: "C", groupIds: ["g2"], isSelected: true },
      { id: "D", groupIds: ["g2"], isSelected: true }
    ]);
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "A_copy",
      "B_copy",
      "C",
      "D",
      "C_copy",
      "D_copy"
    ]);

    populateLayers(
      [
        { id: "A", groupIds: ["g1", "g2"], isSelected: true },
        { id: "B", groupIds: ["g1", "g2"], isSelected: true },
        { id: "C", groupIds: ["g2"], isSelected: true }
      ],
      {
        selectedGroupIds: { g1: true }
      }
    );
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "A_copy",
      "B_copy",
      "C",
      "C_copy"
    ]);

    populateLayers(
      [
        { id: "A", groupIds: ["g1", "g2"], isSelected: true },
        { id: "B", groupIds: ["g1", "g2"], isSelected: true },
        { id: "C", groupIds: ["g2"], isSelected: true }
      ],
      {
        selectedGroupIds: { g2: true }
      }
    );
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "C",
      "A_copy",
      "B_copy",
      "C_copy"
    ]);

    populateLayers(
      [
        { id: "A", groupIds: ["g1", "g2"], isSelected: true },
        { id: "B", groupIds: ["g1", "g2"], isSelected: true },
        { id: "C", groupIds: ["g2"], isSelected: true },
        { id: "D", groupIds: ["g3", "g4"], isSelected: true },
        { id: "E", groupIds: ["g3", "g4"], isSelected: true },
        { id: "F", groupIds: ["g4"], isSelected: true }
      ],
      {
        selectedGroupIds: { g2: true, g4: true }
      }
    );
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "C",
      "A_copy",
      "B_copy",
      "C_copy",
      "D",
      "E",
      "F",
      "D_copy",
      "E_copy",
      "F_copy"
    ]);

    populateLayers(
      [
        { id: "A", groupIds: ["g1", "g2"], isSelected: true },
        { id: "B", groupIds: ["g1", "g2"] },
        { id: "C", groupIds: ["g2"] }
      ],
      { editingGroupId: "g1" }
    );
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "A_copy",
      "B",
      "C"
    ]);

    populateLayers(
      [
        { id: "A", groupIds: ["g1", "g2"] },
        { id: "B", groupIds: ["g1", "g2"], isSelected: true },
        { id: "C", groupIds: ["g2"] }
      ],
      { editingGroupId: "g1" }
    );
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "B_copy",
      "C"
    ]);

    populateLayers(
      [
        { id: "A", groupIds: ["g1", "g2"], isSelected: true },
        { id: "B", groupIds: ["g1", "g2"], isSelected: true },
        { id: "C", groupIds: ["g2"] }
      ],
      { editingGroupId: "g1" }
    );
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "A_copy",
      "B",
      "B_copy",
      "C"
    ]);
  });

  it("duplicating incorrectly interleaved layers (group layers should be together) should still produce reasonable result", () => {
    populateLayers([
      { id: "A", groupIds: ["g1"], isSelected: true },
      { id: "B" },
      { id: "C", groupIds: ["g1"], isSelected: true }
    ]);
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "C",
      "A_copy",
      "C_copy",
      "B"
    ]);
  });

  it("group-selected duplication should includes deleted layers that weren't selected on account of being deleted", () => {
    populateLayers([
      { id: "A", groupIds: ["g1"], isDeleted: true },
      { id: "B", groupIds: ["g1"], isSelected: true },
      { id: "C", groupIds: ["g1"], isSelected: true },
      { id: "D" }
    ]);
    expect(h.state.selectedGroupIds).toEqual({ g1: true });
    h.app.actionManager.executeAction(actionDuplicateSelection);
    expect(h.layers.map((layer) => layer.id)).toEqual([
      "A",
      "B",
      "C",
      "A_copy",
      "B_copy",
      "C_copy",
      "D"
    ]);
  });

  it("text-container binding should be atomic", () => {
    assertZindex({
      layers: [
        { id: "A", isSelected: true },
        { id: "B" },
        { id: "C", containerId: "B" }
      ],
      operations: [
        [actionBringForward, ["B", "C", "A"]],
        [actionSendBackward, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A" },
        { id: "B", isSelected: true },
        { id: "C", containerId: "B" }
      ],
      operations: [
        [actionSendBackward, ["B", "C", "A"]],
        [actionBringForward, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", isSelected: true, groupIds: ["g1"] },
        { id: "B", groupIds: ["g1"] },
        { id: "C", containerId: "B", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionBringForward, ["B", "C", "A"]],
        [actionSendBackward, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1"] },
        { id: "B", groupIds: ["g1"], isSelected: true },
        { id: "C", containerId: "B", groupIds: ["g1"] }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [
        [actionSendBackward, ["B", "C", "A"]],
        [actionBringForward, ["A", "B", "C"]]
      ]
    });

    assertZindex({
      layers: [
        { id: "A", groupIds: ["g1"] },
        { id: "B", isSelected: true, groupIds: ["g1"] },
        { id: "C" },
        { id: "D", containerId: "C" }
      ],
      editorState: {
        editingGroupId: "g1"
      },
      operations: [[actionBringForward, ["A", "B", "C", "D"]]]
    });
  });
});
