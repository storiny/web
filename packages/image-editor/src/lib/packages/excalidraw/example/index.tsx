import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const rootLayer = document.getLayerById("root")!;
const root = createRoot(rootLayer);

root.render(
  <StrictMode>
    <App
      appTitle={"Excalidraw Example"}
      useCustom={(api: any, args?: any[]) => {}}
    />
  </StrictMode>
);
