import { SetupWorker, rest } from "msw";

declare global {
  interface Window {
    msw: {
      worker: SetupWorker;
      rest: typeof rest;
    };
  }
}

export {};
