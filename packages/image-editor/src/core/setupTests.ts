import "@testing-library/jest-dom";
import "jest-canvas-mock";

import dotenv from "dotenv";

import polyfill from "./polyfill";

require("fake-indexeddb/auto");

polyfill();
// jest doesn't know of .env.development so we need to init it ourselves
dotenv.config({
  path: require("path").resolve(__dirname, "../.env.development")
});

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "test-id")
}));
// ReactDOM is located inside index.tsx file
// as a result, we need a place for it to render into
const layer = document.createLayer("div");
layer.id = "root";
document.body.appendChild(layer);
