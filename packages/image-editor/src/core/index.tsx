import "./excalidraw-app/pwa";
import "./excalidraw-app/sentry";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import ExcalidrawApp from "./excalidraw-app";
window.__EXCALIDRAW_SHA__ = process.env.REACT_APP_GIT_SHA;
const rootLayer = document.getLayerById("root")!;
const root = createRoot(rootLayer);
root.render(
  <StrictMode>
    <ExcalidrawApp />
  </StrictMode>
);
