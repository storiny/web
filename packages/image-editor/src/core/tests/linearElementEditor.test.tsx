import { queryByTestId, queryByText } from "@testing-library/react";
import ReactDOM from "react-dom";

import { centerPoint } from "../../lib/math/math";
import { ROUNDNESS, VERTICAL_ALIGN } from "../constants";
import ExcalidrawApp from "../excalidraw-app";
import { KEYS } from "../keys";
import { LinearLayerEditor } from "../layer/linearLayerEditor";
import {
  getBoundTextLayerPosition,
  getBoundTextMaxWidth,
  wrapText
} from "../layer/textLayer";
import * as textLayerUtils from "../layer/textLayer";
import {
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayerWithContainer,
  FontString
} from "../layer/types";
import { reseed } from "../random";
import * as Renderer from "../renderer/renderScene";
import { API } from "../tests/helpers/api";
import { Point } from "../types";
import { Keyboard, Pointer, UI } from "./helpers/ui";
import { fireEvent, GlobalTestState, render, screen } from "./test-utils";
import { resize, rotate } from "./utils";

const renderScene = jest.spyOn(Renderer, "renderScene");

const { h } = window;
const font = "20px Cascadia, width: Segoe UI Emoji" as FontString;

describe("Test Linear Layers", () => {
  let container: HTMLLayer;
  let canvas: HTMLCanvasLayer;

  beforeEach(async () => {
    // Unmount ReactDOM from root
    ReactDOM.unmountComponentAtNode(document.getLayerById("root")!);
    localStorage.clear();
    renderScene.mockClear();
    reseed(7);
    const comp = await render(<ExcalidrawApp />);
    container = comp.container;
    canvas = container.querySelector("canvas")!;
    canvas.width = 1000;
    canvas.height = 1000;
  });

  const p1: Point = [20, 20];
  const p2: Point = [60, 20];
  const midpoint = centerPoint(p1, p2);
  const delta = 50;
  const mouse = new Pointer("mouse");

  const createTwoPointerLinearLayer = (
    type: ExcalidrawLinearLayer["type"],
    roundness: ExcalidrawLayer["roundness"] = null,
    roughness: ExcalidrawLinearLayer["roughness"] = 0
  ) => {
    const line = API.createLayer({
      x: p1[0],
      y: p1[1],
      width: p2[0] - p1[0],
      height: 0,
      type,
      roughness,
      points: [
        [0, 0],
        [p2[0] - p1[0], p2[1] - p1[1]]
      ],
      roundness
    });
    h.layers = [line];

    mouse.clickAt(p1[0], p1[1]);
    return line;
  };

  const createThreePointerLinearLayer = (
    type: ExcalidrawLinearLayer["type"],
    roundness: ExcalidrawLayer["roundness"] = null,
    roughness: ExcalidrawLinearLayer["roughness"] = 0
  ) => {
    //dragging line from midpoint
    const p3 = [midpoint[0] + delta - p1[0], midpoint[1] + delta - p1[1]];
    const line = API.createLayer({
      x: p1[0],
      y: p1[1],
      width: p3[0] - p1[0],
      height: 0,
      type,
      roughness,
      points: [
        [0, 0],
        [p3[0], p3[1]],
        [p2[0] - p1[0], p2[1] - p1[1]]
      ],
      roundness
    });
    h.layers = [line];
    mouse.clickAt(p1[0], p1[1]);
    return line;
  };

  const enterLineEditingMode = (
    line: ExcalidrawLinearLayer,
    selectProgrammatically = false
  ) => {
    if (selectProgrammatically) {
      API.setSelectedLayers([line]);
    } else {
      mouse.clickAt(p1[0], p1[1]);
    }
    Keyboard.withModifierKeys({ ctrl: true }, () => {
      Keyboard.keyPress(KEYS.ENTER);
    });
    expect(h.state.editingLinearLayer?.layerId).toEqual(line.id);
  };

  const drag = (startPoint: Point, endPoint: Point) => {
    fireEvent.pointerDown(canvas, {
      clientX: startPoint[0],
      clientY: startPoint[1]
    });
    fireEvent.pointerMove(canvas, {
      clientX: endPoint[0],
      clientY: endPoint[1]
    });
    fireEvent.pointerUp(canvas, {
      clientX: endPoint[0],
      clientY: endPoint[1]
    });
  };

  const deletePoint = (point: Point) => {
    fireEvent.pointerDown(canvas, {
      clientX: point[0],
      clientY: point[1]
    });
    fireEvent.pointerUp(canvas, {
      clientX: point[0],
      clientY: point[1]
    });
    Keyboard.keyPress(KEYS.DELETE);
  };

  it("should not drag line and add midpoint until dragged beyond a threshold", () => {
    createTwoPointerLinearLayer("line");
    const line = h.layers[0] as ExcalidrawLinearLayer;
    const originalX = line.x;
    const originalY = line.y;
    expect(line.points.length).toEqual(2);

    mouse.clickAt(midpoint[0], midpoint[1]);
    drag(midpoint, [midpoint[0] + 1, midpoint[1] + 1]);

    expect(line.points.length).toEqual(2);

    expect(line.x).toBe(originalX);
    expect(line.y).toBe(originalY);
    expect(line.points.length).toEqual(2);

    drag(midpoint, [midpoint[0] + delta, midpoint[1] + delta]);
    expect(line.x).toBe(originalX);
    expect(line.y).toBe(originalY);
    expect(line.points.length).toEqual(3);
  });

  it("should allow dragging line from midpoint in 2 pointer lines outside editor", async () => {
    createTwoPointerLinearLayer("line");
    const line = h.layers[0] as ExcalidrawLinearLayer;

    expect(renderScene).toHaveBeenCalledTimes(7);
    expect((h.layers[0] as ExcalidrawLinearLayer).points.length).toEqual(2);

    // drag line from midpoint
    drag(midpoint, [midpoint[0] + delta, midpoint[1] + delta]);
    expect(renderScene).toHaveBeenCalledTimes(11);
    expect(line.points.length).toEqual(3);
    expect(line.points).toMatchInlineSnapshot(`
      Array [
        Array [
          0,
          0,
        ],
        Array [
          70,
          50,
        ],
        Array [
          40,
          0,
        ],
      ]
    `);
  });

  it("should allow entering and exiting line editor via context menu", () => {
    createTwoPointerLinearLayer("line");
    fireEvent.contextMenu(GlobalTestState.canvas, {
      button: 2,
      clientX: midpoint[0],
      clientY: midpoint[1]
    });
    // Enter line editor
    let contextMenu = document.querySelector(".context-menu");
    fireEvent.contextMenu(GlobalTestState.canvas, {
      button: 2,
      clientX: midpoint[0],
      clientY: midpoint[1]
    });
    fireEvent.click(queryByText(contextMenu as HTMLLayer, "Edit line")!);

    expect(h.state.editingLinearLayer?.layerId).toEqual(h.layers[0].id);

    // Exiting line editor
    fireEvent.contextMenu(GlobalTestState.canvas, {
      button: 2,
      clientX: midpoint[0],
      clientY: midpoint[1]
    });
    contextMenu = document.querySelector(".context-menu");
    fireEvent.contextMenu(GlobalTestState.canvas, {
      button: 2,
      clientX: midpoint[0],
      clientY: midpoint[1]
    });
    fireEvent.click(queryByText(contextMenu as HTMLLayer, "Exit line editor")!);
    expect(h.state.editingLinearLayer?.layerId).toBeUndefined();
  });

  it("should enter line editor when using double clicked with ctrl key", () => {
    createTwoPointerLinearLayer("line");
    expect(h.state.editingLinearLayer?.layerId).toBeUndefined();

    Keyboard.withModifierKeys({ ctrl: true }, () => {
      mouse.doubleClick();
    });
    expect(h.state.editingLinearLayer?.layerId).toEqual(h.layers[0].id);
  });

  describe("Inside editor", () => {
    it("should not drag line and add midpoint when dragged irrespective of threshold", () => {
      createTwoPointerLinearLayer("line");
      const line = h.layers[0] as ExcalidrawLinearLayer;
      const originalX = line.x;
      const originalY = line.y;
      enterLineEditingMode(line);

      expect(line.points.length).toEqual(2);

      mouse.clickAt(midpoint[0], midpoint[1]);
      expect(line.points.length).toEqual(2);

      drag(midpoint, [midpoint[0] + 1, midpoint[1] + 1]);
      expect(line.x).toBe(originalX);
      expect(line.y).toBe(originalY);
      expect(line.points.length).toEqual(3);
    });

    it("should allow dragging line from midpoint in 2 pointer lines", async () => {
      createTwoPointerLinearLayer("line");

      const line = h.layers[0] as ExcalidrawLinearLayer;
      enterLineEditingMode(line);

      // drag line from midpoint
      drag(midpoint, [midpoint[0] + delta, midpoint[1] + delta]);
      expect(renderScene).toHaveBeenCalledTimes(15);

      expect(line.points.length).toEqual(3);
      expect(line.points).toMatchInlineSnapshot(`
        Array [
          Array [
            0,
            0,
          ],
          Array [
            70,
            50,
          ],
          Array [
            40,
            0,
          ],
        ]
      `);
    });

    it("should update the midpoints when layer roundness changed", async () => {
      createThreePointerLinearLayer("line");

      const line = h.layers[0] as ExcalidrawLinearLayer;
      expect(line.points.length).toEqual(3);

      enterLineEditingMode(line);

      const midPointsWithSharpEdge = LinearLayerEditor.getEditorMidPoints(
        line,
        h.state
      );

      // update roundness
      fireEvent.click(screen.getByTitle("Round"));

      expect(renderScene).toHaveBeenCalledTimes(12);
      const midPointsWithRoundEdge = LinearLayerEditor.getEditorMidPoints(
        h.layers[0] as ExcalidrawLinearLayer,
        h.state
      );
      expect(midPointsWithRoundEdge[0]).not.toEqual(midPointsWithSharpEdge[0]);
      expect(midPointsWithRoundEdge[1]).not.toEqual(midPointsWithSharpEdge[1]);

      expect(midPointsWithRoundEdge).toMatchInlineSnapshot(`
        Array [
          Array [
            55.9697848965255,
            47.442326230998205,
          ],
          Array [
            76.08587175006699,
            43.294165939653226,
          ],
        ]
      `);
    });

    it("should update all the midpoints when layer position changed", async () => {
      createThreePointerLinearLayer("line", {
        type: ROUNDNESS.PROPORTIONAL_RADIUS
      });

      const line = h.layers[0] as ExcalidrawLinearLayer;
      expect(line.points.length).toEqual(3);
      enterLineEditingMode(line);

      const points = LinearLayerEditor.getPointsGlobalCoordinates(line);
      expect([line.x, line.y]).toEqual(points[0]);

      const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);

      const startPoint = centerPoint(points[0], midPoints[0] as Point);
      const deltaX = 50;
      const deltaY = 20;
      const endPoint: Point = [startPoint[0] + deltaX, startPoint[1] + deltaY];

      // Move the layer
      drag(startPoint, endPoint);

      expect(renderScene).toHaveBeenCalledTimes(16);
      expect([line.x, line.y]).toEqual([
        points[0][0] + deltaX,
        points[0][1] + deltaY
      ]);

      const newMidPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);
      expect(midPoints[0]).not.toEqual(newMidPoints[0]);
      expect(midPoints[1]).not.toEqual(newMidPoints[1]);
      expect(newMidPoints).toMatchInlineSnapshot(`
        Array [
          Array [
            105.96978489652551,
            67.4423262309982,
          ],
          Array [
            126.08587175006699,
            63.294165939653226,
          ],
        ]
      `);
    });

    describe("When edges are round", () => {
      // This is the expected midpoint for line with round edge
      // hence hardcoding it so if later some bug is introduced
      // this will fail and we can fix it
      const firstSegmentMidpoint: Point = [55, 45];
      const lastSegmentMidpoint: Point = [75, 40];

      let line: ExcalidrawLinearLayer;

      beforeEach(() => {
        line = createThreePointerLinearLayer("line");

        expect(line.points.length).toEqual(3);

        enterLineEditingMode(line);
      });

      it("should allow dragging lines from midpoints in between segments", async () => {
        // drag line via first segment midpoint
        drag(firstSegmentMidpoint, [
          firstSegmentMidpoint[0] + delta,
          firstSegmentMidpoint[1] + delta
        ]);
        expect(line.points.length).toEqual(4);

        // drag line from last segment midpoint
        drag(lastSegmentMidpoint, [
          lastSegmentMidpoint[0] + delta,
          lastSegmentMidpoint[1] + delta
        ]);

        expect(renderScene).toHaveBeenCalledTimes(21);
        expect(line.points.length).toEqual(5);

        expect((h.layers[0] as ExcalidrawLinearLayer).points)
          .toMatchInlineSnapshot(`
          Array [
            Array [
              0,
              0,
            ],
            Array [
              85,
              75,
            ],
            Array [
              70,
              50,
            ],
            Array [
              105,
              70,
            ],
            Array [
              40,
              0,
            ],
          ]
        `);
      });

      it("should update only the first segment midpoint when its point is dragged", async () => {
        const points = LinearLayerEditor.getPointsGlobalCoordinates(line);
        const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);

        const hitCoords: Point = [points[0][0], points[0][1]];

        // Drag from first point
        drag(hitCoords, [hitCoords[0] - delta, hitCoords[1] - delta]);

        expect(renderScene).toHaveBeenCalledTimes(16);

        const newPoints = LinearLayerEditor.getPointsGlobalCoordinates(line);
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] - delta,
          points[0][1] - delta
        ]);

        const newMidPoints = LinearLayerEditor.getEditorMidPoints(
          line,
          h.state
        );

        expect(midPoints[0]).not.toEqual(newMidPoints[0]);
        expect(midPoints[1]).toEqual(newMidPoints[1]);
      });

      it("should hide midpoints in the segment when points moved close", async () => {
        const points = LinearLayerEditor.getPointsGlobalCoordinates(line);
        const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);

        const hitCoords: Point = [points[0][0], points[0][1]];

        // Drag from first point
        drag(hitCoords, [hitCoords[0] + delta, hitCoords[1] + delta]);

        expect(renderScene).toHaveBeenCalledTimes(16);

        const newPoints = LinearLayerEditor.getPointsGlobalCoordinates(line);
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] + delta,
          points[0][1] + delta
        ]);

        const newMidPoints = LinearLayerEditor.getEditorMidPoints(
          line,
          h.state
        );
        // This midpoint is hidden since the points are too close
        expect(newMidPoints[0]).toBeNull();
        expect(midPoints[1]).toEqual(newMidPoints[1]);
      });

      it("should remove the midpoint when one of the points in the segment is deleted", async () => {
        const line = h.layers[0] as ExcalidrawLinearLayer;
        enterLineEditingMode(line);
        const points = LinearLayerEditor.getPointsGlobalCoordinates(line);

        // dragging line from last segment midpoint
        drag(lastSegmentMidpoint, [
          lastSegmentMidpoint[0] + 50,
          lastSegmentMidpoint[1] + 50
        ]);
        expect(line.points.length).toEqual(4);

        const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);

        // delete 3rd point
        deletePoint(points[2]);
        expect(line.points.length).toEqual(3);
        expect(renderScene).toHaveBeenCalledTimes(22);

        const newMidPoints = LinearLayerEditor.getEditorMidPoints(
          line,
          h.state
        );
        expect(newMidPoints.length).toEqual(2);
        expect(midPoints[0]).toEqual(newMidPoints[0]);
        expect(midPoints[1]).toEqual(newMidPoints[1]);
      });
    });

    describe("When edges are round", () => {
      // This is the expected midpoint for line with round edge
      // hence hardcoding it so if later some bug is introduced
      // this will fail and we can fix it
      const firstSegmentMidpoint: Point = [
        55.9697848965255, 47.442326230998205
      ];
      const lastSegmentMidpoint: Point = [
        76.08587175006699, 43.294165939653226
      ];
      let line: ExcalidrawLinearLayer;

      beforeEach(() => {
        line = createThreePointerLinearLayer("line", {
          type: ROUNDNESS.PROPORTIONAL_RADIUS
        });
        expect(line.points.length).toEqual(3);

        enterLineEditingMode(line);
      });

      it("should allow dragging lines from midpoints in between segments", async () => {
        // drag line from first segment midpoint
        drag(firstSegmentMidpoint, [
          firstSegmentMidpoint[0] + delta,
          firstSegmentMidpoint[1] + delta
        ]);
        expect(line.points.length).toEqual(4);

        // drag line from last segment midpoint
        drag(lastSegmentMidpoint, [
          lastSegmentMidpoint[0] + delta,
          lastSegmentMidpoint[1] + delta
        ]);
        expect(renderScene).toHaveBeenCalledTimes(21);

        expect(line.points.length).toEqual(5);

        expect((h.layers[0] as ExcalidrawLinearLayer).points)
          .toMatchInlineSnapshot(`
          Array [
            Array [
              0,
              0,
            ],
            Array [
              85.96978489652551,
              77.4423262309982,
            ],
            Array [
              70,
              50,
            ],
            Array [
              106.08587175006699,
              73.29416593965323,
            ],
            Array [
              40,
              0,
            ],
          ]
        `);
      });

      it("should update all the midpoints when its point is dragged", async () => {
        const points = LinearLayerEditor.getPointsGlobalCoordinates(line);
        const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);

        const hitCoords: Point = [points[0][0], points[0][1]];

        // Drag from first point
        drag(hitCoords, [hitCoords[0] - delta, hitCoords[1] - delta]);

        const newPoints = LinearLayerEditor.getPointsGlobalCoordinates(line);
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] - delta,
          points[0][1] - delta
        ]);

        const newMidPoints = LinearLayerEditor.getEditorMidPoints(
          line,
          h.state
        );

        expect(midPoints[0]).not.toEqual(newMidPoints[0]);
        expect(midPoints[1]).not.toEqual(newMidPoints[1]);
        expect(newMidPoints).toMatchInlineSnapshot(`
          Array [
            Array [
              31.884084517616053,
              23.13275505472383,
            ],
            Array [
              77.74792546875662,
              44.57840982272327,
            ],
          ]
        `);
      });

      it("should hide midpoints in the segment when points moved close", async () => {
        const points = LinearLayerEditor.getPointsGlobalCoordinates(line);
        const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);

        const hitCoords: Point = [points[0][0], points[0][1]];

        // Drag from first point
        drag(hitCoords, [hitCoords[0] + delta, hitCoords[1] + delta]);

        expect(renderScene).toHaveBeenCalledTimes(16);

        const newPoints = LinearLayerEditor.getPointsGlobalCoordinates(line);
        expect([newPoints[0][0], newPoints[0][1]]).toEqual([
          points[0][0] + delta,
          points[0][1] + delta
        ]);

        const newMidPoints = LinearLayerEditor.getEditorMidPoints(
          line,
          h.state
        );
        // This mid point is hidden due to point being too close
        expect(newMidPoints[0]).toBeNull();
        expect(newMidPoints[1]).not.toEqual(midPoints[1]);
      });

      it("should update all the midpoints when a point is deleted", async () => {
        drag(lastSegmentMidpoint, [
          lastSegmentMidpoint[0] + delta,
          lastSegmentMidpoint[1] + delta
        ]);
        expect(line.points.length).toEqual(4);

        const midPoints = LinearLayerEditor.getEditorMidPoints(line, h.state);
        const points = LinearLayerEditor.getPointsGlobalCoordinates(line);

        // delete 3rd point
        deletePoint(points[2]);
        expect(line.points.length).toEqual(3);

        const newMidPoints = LinearLayerEditor.getEditorMidPoints(
          line,
          h.state
        );
        expect(newMidPoints.length).toEqual(2);
        expect(midPoints[0]).not.toEqual(newMidPoints[0]);
        expect(midPoints[1]).not.toEqual(newMidPoints[1]);
        expect(newMidPoints).toMatchInlineSnapshot(`
          Array [
            Array [
              55.9697848965255,
              47.442326230998205,
            ],
            Array [
              76.08587175006699,
              43.294165939653226,
            ],
          ]
        `);
      });
    });

    it("in-editor dragging a line point covered by another layer", () => {
      createTwoPointerLinearLayer("line");
      const line = h.layers[0] as ExcalidrawLinearLayer;
      h.layers = [
        line,
        API.createLayer({
          type: "rectangle",
          x: line.x - 50,
          y: line.y - 50,
          width: 100,
          height: 100,
          backgroundColor: "red",
          fillStyle: "solid"
        })
      ];
      const dragEndPositionOffset = [100, 100] as const;
      API.setSelectedLayers([line]);
      enterLineEditingMode(line, true);
      drag(
        [line.points[0][0] + line.x, line.points[0][1] + line.y],
        [dragEndPositionOffset[0] + line.x, dragEndPositionOffset[1] + line.y]
      );
      expect(line.points).toMatchInlineSnapshot(`
        Array [
          Array [
            0,
            0,
          ],
          Array [
            -60,
            -100,
          ],
        ]
      `);
    });
  });

  describe("Test bound text layer", () => {
    const DEFAULT_TEXT = "Online whiteboard collaboration made easy";

    const createBoundTextLayer = (
      text: string,
      container: ExcalidrawLinearLayer
    ) => {
      const textLayer = API.createLayer({
        type: "text",
        x: 0,
        y: 0,
        text: wrapText(text, font, getBoundTextMaxWidth(container)),
        containerId: container.id,
        width: 30,
        height: 20
      }) as ExcalidrawTextLayerWithContainer;

      container = {
        ...container,
        boundLayers: (container.boundLayers || []).concat({
          type: "text",
          id: textLayer.id
        })
      };
      const layers: ExcalidrawLayer[] = [];
      h.layers.forEach((layer) => {
        if (layer.id === container.id) {
          layers.push(container);
        } else {
          layers.push(layer);
        }
      });
      const updatedTextLayer = { ...textLayer, originalText: text };
      h.layers = [...layers, updatedTextLayer];
      return { textLayer: updatedTextLayer, container };
    };

    describe("Test getBoundTextLayerPosition", () => {
      it("should return correct position for 2 pointer arrow", () => {
        createTwoPointerLinearLayer("arrow");
        const arrow = h.layers[0] as ExcalidrawLinearLayer;
        const { textLayer, container } = createBoundTextLayer(
          DEFAULT_TEXT,
          arrow
        );
        const position = LinearLayerEditor.getBoundTextLayerPosition(
          container,
          textLayer
        );
        expect(position).toMatchInlineSnapshot(`
          Object {
            "x": 25,
            "y": 10,
          }
        `);
      });

      it("should return correct position for arrow with odd points", () => {
        createThreePointerLinearLayer("arrow", {
          type: ROUNDNESS.PROPORTIONAL_RADIUS
        });
        const arrow = h.layers[0] as ExcalidrawLinearLayer;
        const { textLayer, container } = createBoundTextLayer(
          DEFAULT_TEXT,
          arrow
        );

        const position = LinearLayerEditor.getBoundTextLayerPosition(
          container,
          textLayer
        );
        expect(position).toMatchInlineSnapshot(`
          Object {
            "x": 75,
            "y": 60,
          }
        `);
      });

      it("should return correct position for arrow with even points", () => {
        createThreePointerLinearLayer("arrow", {
          type: ROUNDNESS.PROPORTIONAL_RADIUS
        });
        const arrow = h.layers[0] as ExcalidrawLinearLayer;
        const { textLayer, container } = createBoundTextLayer(
          DEFAULT_TEXT,
          arrow
        );
        enterLineEditingMode(container);
        // This is the expected midpoint for line with round edge
        // hence hardcoding it so if later some bug is introduced
        // this will fail and we can fix it
        const firstSegmentMidpoint: Point = [
          55.9697848965255, 47.442326230998205
        ];
        // drag line from first segment midpoint
        drag(firstSegmentMidpoint, [
          firstSegmentMidpoint[0] + delta,
          firstSegmentMidpoint[1] + delta
        ]);

        const position = LinearLayerEditor.getBoundTextLayerPosition(
          container,
          textLayer
        );
        expect(position).toMatchInlineSnapshot(`
          Object {
            "x": 85.82201843191861,
            "y": 75.63461309860818,
          }
        `);
      });
    });

    it("should match styles for text editor", () => {
      createTwoPointerLinearLayer("arrow");
      Keyboard.keyPress(KEYS.ENTER);
      const editor = document.querySelector(
        ".excalidraw-textEditorContainer > textarea"
      ) as HTMLTextAreaLayer;
      expect(editor).toMatchSnapshot();
    });

    it("should bind text to arrow when double clicked", async () => {
      createTwoPointerLinearLayer("arrow");
      const arrow = h.layers[0] as ExcalidrawLinearLayer;

      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(arrow.id);
      mouse.doubleClickAt(arrow.x, arrow.y);
      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBe(arrow.id);
      mouse.down();
      const editor = document.querySelector(
        ".excalidraw-textEditorContainer > textarea"
      ) as HTMLTextAreaLayer;

      fireEvent.change(editor, {
        target: { value: DEFAULT_TEXT }
      });

      await new Promise((r) => setTimeout(r, 0));
      editor.blur();
      expect(arrow.boundLayers).toStrictEqual([{ id: text.id, type: "text" }]);
      expect((h.layers[1] as ExcalidrawTextLayerWithContainer).text)
        .toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
    });

    it("should bind text to arrow when clicked on arrow and enter pressed", async () => {
      const arrow = createTwoPointerLinearLayer("arrow");

      expect(h.layers.length).toBe(1);
      expect(h.layers[0].id).toBe(arrow.id);

      Keyboard.keyPress(KEYS.ENTER);

      expect(h.layers.length).toBe(2);

      const textLayer = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(textLayer.type).toBe("text");
      expect(textLayer.containerId).toBe(arrow.id);
      const editor = document.querySelector(
        ".excalidraw-textEditorContainer > textarea"
      ) as HTMLTextAreaLayer;

      await new Promise((r) => setTimeout(r, 0));

      fireEvent.change(editor, {
        target: { value: DEFAULT_TEXT }
      });
      editor.blur();
      expect(arrow.boundLayers).toStrictEqual([
        { id: textLayer.id, type: "text" }
      ]);
      expect((h.layers[1] as ExcalidrawTextLayerWithContainer).text)
        .toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
    });

    it("should not bind text to line when double clicked", async () => {
      const line = createTwoPointerLinearLayer("line");

      expect(h.layers.length).toBe(1);
      mouse.doubleClickAt(line.x, line.y);

      expect(h.layers.length).toBe(2);

      const text = h.layers[1] as ExcalidrawTextLayerWithContainer;
      expect(text.type).toBe("text");
      expect(text.containerId).toBeNull();
      expect(line.boundLayers).toBeNull();
    });

    it("should not rotate the bound text and update position of bound text and bounding box correctly when arrow rotated", () => {
      createThreePointerLinearLayer("arrow", {
        type: ROUNDNESS.PROPORTIONAL_RADIUS
      });

      const arrow = h.layers[0] as ExcalidrawLinearLayer;

      const { textLayer, container } = createBoundTextLayer(
        DEFAULT_TEXT,
        arrow
      );

      expect(container.angle).toBe(0);
      expect(textLayer.angle).toBe(0);
      expect(getBoundTextLayerPosition(arrow, textLayer))
        .toMatchInlineSnapshot(`
        Object {
          "x": 75,
          "y": 60,
        }
      `);
      expect(textLayer.text).toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
      expect(LinearLayerEditor.getLayerAbsoluteCoords(container, true))
        .toMatchInlineSnapshot(`
        Array [
          20,
          20,
          105,
          80,
          55.45893770831013,
          45,
        ]
      `);

      rotate(container, -35, 55);
      expect(container.angle).toMatchInlineSnapshot(`1.3988061968364685`);
      expect(textLayer.angle).toBe(0);
      expect(getBoundTextLayerPosition(container, textLayer))
        .toMatchInlineSnapshot(`
        Object {
          "x": 21.73926141863671,
          "y": 73.31003398390868,
        }
      `);
      expect(textLayer.text).toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
      expect(LinearLayerEditor.getLayerAbsoluteCoords(container, true))
        .toMatchInlineSnapshot(`
        Array [
          20,
          20,
          102.41961302274555,
          86.49012635273976,
          55.45893770831013,
          45,
        ]
      `);
    });

    it("should resize and position the bound text and bounding box correctly when 3 pointer arrow layer resized", () => {
      createThreePointerLinearLayer("arrow", {
        type: ROUNDNESS.PROPORTIONAL_RADIUS
      });

      const arrow = h.layers[0] as ExcalidrawLinearLayer;

      const { textLayer, container } = createBoundTextLayer(
        DEFAULT_TEXT,
        arrow
      );
      expect(container.width).toBe(70);
      expect(container.height).toBe(50);
      expect(getBoundTextLayerPosition(container, textLayer))
        .toMatchInlineSnapshot(`
        Object {
          "x": 75,
          "y": 60,
        }
      `);
      expect(textLayer.text).toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
      expect(LinearLayerEditor.getLayerAbsoluteCoords(container, true))
        .toMatchInlineSnapshot(`
        Array [
          20,
          20,
          105,
          80,
          55.45893770831013,
          45,
        ]
      `);

      resize(container, "ne", [300, 200]);

      expect({ width: container.width, height: container.height })
        .toMatchInlineSnapshot(`
        Object {
          "height": 130,
          "width": 367,
        }
      `);

      expect(getBoundTextLayerPosition(container, textLayer))
        .toMatchInlineSnapshot(`
        Object {
          "x": 272,
          "y": 45,
        }
      `);
      expect((h.layers[1] as ExcalidrawTextLayerWithContainer).text)
        .toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made easy"
      `);
      expect(LinearLayerEditor.getLayerAbsoluteCoords(container, true))
        .toMatchInlineSnapshot(`
        Array [
          20,
          35,
          502,
          95,
          205.9061448421403,
          52.5,
        ]
      `);
    });

    it("should resize and position the bound text correctly when 2 pointer linear layer resized", () => {
      createTwoPointerLinearLayer("arrow");

      const arrow = h.layers[0] as ExcalidrawLinearLayer;
      const { textLayer, container } = createBoundTextLayer(
        DEFAULT_TEXT,
        arrow
      );
      expect(container.width).toBe(40);
      expect(getBoundTextLayerPosition(container, textLayer))
        .toMatchInlineSnapshot(`
        Object {
          "x": 25,
          "y": 10,
        }
      `);
      expect(textLayer.text).toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
      const points = LinearLayerEditor.getPointsGlobalCoordinates(container);

      // Drag from last point
      drag(points[1], [points[1][0] + 300, points[1][1]]);

      expect({ width: container.width, height: container.height })
        .toMatchInlineSnapshot(`
        Object {
          "height": 130,
          "width": 340,
        }
      `);

      expect(getBoundTextLayerPosition(container, textLayer))
        .toMatchInlineSnapshot(`
        Object {
          "x": 75,
          "y": -5,
        }
      `);
      expect(textLayer.text).toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made easy"
      `);
    });

    it("should not render vertical align tool when layer selected", () => {
      createTwoPointerLinearLayer("arrow");
      const arrow = h.layers[0] as ExcalidrawLinearLayer;

      createBoundTextLayer(DEFAULT_TEXT, arrow);
      API.setSelectedLayers([arrow]);

      expect(queryByTestId(container, "align-top")).not.toBeInTheDocument();
      expect(queryByTestId(container, "align-middle")).not.toBeInTheDocument();
      expect(queryByTestId(container, "align-bottom")).not.toBeInTheDocument();
    });

    it("should wrap the bound text when arrow bound container moves", async () => {
      const rect = UI.createLayer("rectangle", {
        x: 400,
        width: 200,
        height: 500
      });
      const arrow = UI.createLayer("arrow", {
        x: 210,
        y: 250,
        width: 400,
        height: 1
      });

      mouse.select(arrow);
      Keyboard.keyPress(KEYS.ENTER);
      const editor = document.querySelector(
        ".excalidraw-textEditorContainer > textarea"
      ) as HTMLTextAreaLayer;
      await new Promise((r) => setTimeout(r, 0));
      fireEvent.change(editor, { target: { value: DEFAULT_TEXT } });
      editor.blur();

      const textLayer = h.layers[2] as ExcalidrawTextLayerWithContainer;

      expect(arrow.endBinding?.layerId).toBe(rect.id);
      expect(arrow.width).toBe(400);
      expect(rect.x).toBe(400);
      expect(rect.y).toBe(0);
      expect(
        wrapText(textLayer.originalText, font, getBoundTextMaxWidth(arrow))
      ).toMatchInlineSnapshot(`
        "Online whiteboard collaboration
        made easy"
      `);
      const handleBindTextResizeSpy = jest.spyOn(
        textLayerUtils,
        "handleBindTextResize"
      );

      mouse.select(rect);
      mouse.downAt(rect.x, rect.y);
      mouse.moveTo(200, 0);
      mouse.upAt(200, 0);

      expect(arrow.width).toBe(170);
      expect(rect.x).toBe(200);
      expect(rect.y).toBe(0);
      expect(handleBindTextResizeSpy).toHaveBeenCalledWith(h.layers[1], false);
      expect(
        wrapText(textLayer.originalText, font, getBoundTextMaxWidth(arrow))
      ).toMatchInlineSnapshot(`
        "Online whiteboard 
        collaboration made 
        easy"
      `);
    });

    it("should not render horizontal align tool when layer selected", () => {
      createTwoPointerLinearLayer("arrow");
      const arrow = h.layers[0] as ExcalidrawLinearLayer;

      createBoundTextLayer(DEFAULT_TEXT, arrow);
      API.setSelectedLayers([arrow]);

      expect(queryByTestId(container, "align-left")).not.toBeInTheDocument();
      expect(
        queryByTestId(container, "align-horizontal-center")
      ).not.toBeInTheDocument();
      expect(queryByTestId(container, "align-right")).not.toBeInTheDocument();
    });

    it("should update label coords when a label binded via context menu is unbinded", async () => {
      createTwoPointerLinearLayer("arrow");
      const text = API.createLayer({
        type: "text",
        text: "Hello Excalidraw"
      });
      expect(text.x).toBe(0);
      expect(text.y).toBe(0);

      h.layers = [h.layers[0], text];

      const container = h.layers[0];
      API.setSelectedLayers([container, text]);
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });
      let contextMenu = document.querySelector(".context-menu");

      fireEvent.click(
        queryByText(contextMenu as HTMLLayer, "Bind text to the container")!
      );
      expect(container.boundLayers).toStrictEqual([
        { id: h.layers[1].id, type: "text" }
      ]);
      expect(text.containerId).toBe(container.id);
      expect(text.verticalAlign).toBe(VERTICAL_ALIGN.MIDDLE);

      mouse.reset();
      mouse.clickAt(
        container.x + container.width / 2,
        container.y + container.height / 2
      );
      mouse.down();
      mouse.up();
      API.setSelectedLayers([h.layers[0], h.layers[1]]);

      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 20,
        clientY: 30
      });
      contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLLayer, "Unbind text")!);
      expect(container.boundLayers).toEqual([]);
      expect(text).toEqual(
        expect.objectContaining({
          containerId: null,
          width: 160,
          height: 25,
          x: -40,
          y: 7.5
        })
      );
    });
  });
});
