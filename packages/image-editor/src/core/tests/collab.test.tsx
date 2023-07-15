import { createUndoAction } from "../actions/actionHistory";
import ExcalidrawApp from "../excalidraw-app";
import { API } from "./helpers/api";
import { render, updateSceneData, waitFor } from "./test-utils";
const { h } = window;

Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (arr: number[]) =>
      arr.forEach((v, i) => (arr[i] = Math.floor(Math.random() * 256))),
    subtle: {
      generateKey: () => {},
      exportKey: () => ({ k: "sTdLvMC_M3V8_vGa3UVRDg" })
    }
  }
});

jest.mock("../excalidraw-app/data/index.ts", () => ({
  __esmodule: true,
  ...jest.requireActual("../excalidraw-app/data/index.ts"),
  getCollabServer: jest.fn(() => ({
    url: /* doesn't really matter */ "http://localhost:3002"
  }))
}));

jest.mock("../excalidraw-app/data/firebase.ts", () => {
  const loadFromFirebase = async () => null;
  const saveToFirebase = () => {};
  const isSavedToFirebase = () => true;
  const loadFilesFromFirebase = async () => ({
    loadedFiles: [],
    erroredFiles: []
  });
  const saveFilesToFirebase = async () => ({
    savedFiles: new Map(),
    erroredFiles: new Map()
  });

  return {
    loadFromFirebase,
    saveToFirebase,
    isSavedToFirebase,
    loadFilesFromFirebase,
    saveFilesToFirebase
  };
});

jest.mock("socket.io-client", () => () => ({
  close: () => {},
  on: () => {},
  once: () => {},
  off: () => {},
  emit: () => {}
}));

describe("collaboration", () => {
  it("creating room should reset deleted layers", async () => {
    await render(<ExcalidrawApp />);
    // To update the scene with deleted layers before starting collab
    updateSceneData({
      layers: [
        API.createLayer({ type: "rectangle", id: "A" }),
        API.createLayer({
          type: "rectangle",
          id: "B",
          isDeleted: true
        })
      ]
    });
    await waitFor(() => {
      expect(h.layers).toEqual([
        expect.objectContaining({ id: "A" }),
        expect.objectContaining({ id: "B", isDeleted: true })
      ]);
      expect(API.getStateHistory().length).toBe(1);
    });
    window.collab.startCollaboration(null);
    await waitFor(() => {
      expect(h.layers).toEqual([expect.objectContaining({ id: "A" })]);
      expect(API.getStateHistory().length).toBe(1);
    });

    const undoAction = createUndoAction(h.history);
    // noop
    h.app.actionManager.executeAction(undoAction);
    await waitFor(() => {
      expect(h.layers).toEqual([expect.objectContaining({ id: "A" })]);
      expect(API.getStateHistory().length).toBe(1);
    });
  });
});
