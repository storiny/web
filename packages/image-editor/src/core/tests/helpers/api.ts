import fs from "fs";
import path from "path";
import util from "util";

import { getMimeType } from "../../../lib/data/blob/blob";
import { getSelectedLayers } from "../../../lib/scene/selection/selection";
import { getDefaultAppState } from "../../appState";
import { DEFAULT_VERTICAL_ALIGN, ROUNDNESS } from "../../constants";
import { newLayer, newLinearLayer, newTextLayer } from "../../layer";
import { newFreeDrawLayer, newImageLayer } from "../../layer/newLayer";
import { isLinearLayerType } from "../../layer/typeChecks";
import {
  ExcalidrawFreeDrawLayer,
  ExcalidrawGenericLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayer,
  FileId
} from "../../layer/types";
import { Point } from "../../types";
import { Mutable } from "../../utility-types";
import { createEvent, fireEvent, GlobalTestState } from "../test-utils";

const readFile = util.promisify(fs.readFile);

const { h } = window;

export class API {
  static setSelectedLayers = (layers: ExcalidrawLayer[]) => {
    h.setState({
      selectedLayerIds: layers.reduce((acc, layer) => {
        acc[layer.id] = true;
        return acc;
      }, {} as Record<ExcalidrawLayer["id"], true>)
    });
  };

  static getSelectedLayers = (
    includeBoundTextLayer: boolean = false,
    includeLayersInFrames: boolean = false
  ): ExcalidrawLayer[] =>
    getSelectedLayers(h.layers, h.state, {
      includeBoundTextLayer,
      includeLayersInFrames
    });

  static getSelectedLayer = (): ExcalidrawLayer => {
    const selectedLayers = API.getSelectedLayers();
    if (selectedLayers.length !== 1) {
      throw new Error(
        `expected 1 selected layer; got ${selectedLayers.length}`
      );
    }
    return selectedLayers[0];
  };

  static getStateHistory = () => h.history.stateHistory;

  static clearSelection = () => {
    // @ts-ignore
    h.app.clearSelection(null);
    expect(API.getSelectedLayers().length).toBe(0);
  };

  static createLayer = <
    T extends Exclude<ExcalidrawLayer["type"], "selection"> = "rectangle"
  >({
    // @ts-ignore
    type = "rectangle",
    id,
    x = 0,
    y = x,
    width = 100,
    height = width,
    isDeleted = false,
    groupIds = [],
    ...rest
  }: {
    angle?: number;
    backgroundColor?: ExcalidrawGenericLayer["backgroundColor"];
    boundLayers?: ExcalidrawGenericLayer["boundLayers"];
    containerId?: T extends "text" ? ExcalidrawTextLayer["containerId"] : never;
    endBinding?: T extends "arrow"
      ? ExcalidrawLinearLayer["endBinding"]
      : never;
    fileId?: T extends "image" ? string : never;
    fillStyle?: ExcalidrawGenericLayer["fillStyle"];
    fontFamily?: T extends "text" ? ExcalidrawTextLayer["fontFamily"] : never;
    fontSize?: T extends "text" ? ExcalidrawTextLayer["fontSize"] : never;
    groupIds?: string[];
    height?: number;
    id?: string;
    isDeleted?: boolean;
    locked?: boolean;
    opacity?: ExcalidrawGenericLayer["opacity"];
    points?: T extends "arrow" | "line" ? readonly Point[] : never;
    roughness?: ExcalidrawGenericLayer["roughness"];
    roundness?: ExcalidrawGenericLayer["roundness"];
    scale?: T extends "image" ? ExcalidrawImageLayer["scale"] : never;
    startBinding?: T extends "arrow"
      ? ExcalidrawLinearLayer["startBinding"]
      : never;
    status?: T extends "image" ? ExcalidrawImageLayer["status"] : never;
    // generic layer props
    strokeColor?: ExcalidrawGenericLayer["strokeColor"];
    strokeStyle?: ExcalidrawGenericLayer["strokeStyle"];
    strokeWidth?: ExcalidrawGenericLayer["strokeWidth"];
    // text props
    text?: T extends "text" ? ExcalidrawTextLayer["text"] : never;
    textAlign?: T extends "text" ? ExcalidrawTextLayer["textAlign"] : never;
    type?: T;
    verticalAlign?: T extends "text"
      ? ExcalidrawTextLayer["verticalAlign"]
      : never;
    width?: number;
    x?: number;
    y?: number;
  }): T extends "arrow" | "line"
    ? ExcalidrawLinearLayer
    : T extends "freedraw"
    ? ExcalidrawFreeDrawLayer
    : T extends "text"
    ? ExcalidrawTextLayer
    : T extends "image"
    ? ExcalidrawImageLayer
    : ExcalidrawGenericLayer => {
    let layer: Mutable<ExcalidrawLayer> = null!;

    const appState = h?.state || getDefaultAppState();

    const base: Omit<
      ExcalidrawGenericLayer,
      | "id"
      | "width"
      | "height"
      | "type"
      | "seed"
      | "version"
      | "versionNonce"
      | "isDeleted"
      | "groupIds"
      | "frameId"
      | "link"
      | "updated"
    > = {
      x,
      y,
      angle: rest.angle ?? 0,
      strokeColor: rest.strokeColor ?? appState.currentItemStrokeColor,
      backgroundColor:
        rest.backgroundColor ?? appState.currentItemBackgroundColor,
      fillStyle: rest.fillStyle ?? appState.currentItemFillStyle,
      strokeWidth: rest.strokeWidth ?? appState.currentItemStrokeWidth,
      strokeStyle: rest.strokeStyle ?? appState.currentItemStrokeStyle,
      roundness: (
        rest.roundness === undefined
          ? appState.currentItemRoundness === "round"
          : rest.roundness
      )
        ? {
            type: isLinearLayerType(type)
              ? ROUNDNESS.PROPORTIONAL_RADIUS
              : ROUNDNESS.ADAPTIVE_RADIUS
          }
        : null,
      roughness: rest.roughness ?? appState.currentItemRoughness,
      opacity: rest.opacity ?? appState.currentItemOpacity,
      boundLayers: rest.boundLayers ?? null,
      locked: rest.locked ?? false
    };
    switch (type) {
      case "rectangle":
      case "diamond":
      case "ellipse":
        layer = newLayer({
          type: type as "rectangle" | "diamond" | "ellipse",
          width,
          height,
          ...base
        });
        break;
      case "text":
        const fontSize = rest.fontSize ?? appState.currentItemFontSize;
        const fontFamily = rest.fontFamily ?? appState.currentItemFontFamily;
        layer = newTextLayer({
          ...base,
          text: rest.text || "test",
          fontSize,
          fontFamily,
          textAlign: rest.textAlign ?? appState.currentItemTextAlign,
          verticalAlign: rest.verticalAlign ?? DEFAULT_VERTICAL_ALIGN,
          containerId: rest.containerId ?? undefined
        });
        layer.width = width;
        layer.height = height;
        break;
      case "freedraw":
        layer = newFreeDrawLayer({
          type: type as "freedraw",
          simulatePressure: true,
          ...base
        });
        break;
      case "arrow":
      case "line":
        layer = newLinearLayer({
          ...base,
          width,
          height,
          type,
          startArrowhead: null,
          endArrowhead: null,
          points: rest.points ?? [
            [0, 0],
            [100, 100]
          ]
        });
        break;
      case "image":
        layer = newImageLayer({
          ...base,
          width,
          height,
          type,
          fileId: (rest.fileId as string as FileId) ?? null,
          status: rest.status || "saved",
          scale: rest.scale || [1, 1]
        });
        break;
    }
    if (layer.type === "arrow") {
      layer.startBinding = rest.startBinding ?? null;
      layer.endBinding = rest.endBinding ?? null;
    }
    if (id) {
      layer.id = id;
    }
    if (isDeleted) {
      layer.isDeleted = isDeleted;
    }
    if (groupIds) {
      layer.groupIds = groupIds;
    }
    return layer as any;
  };

  static readFile = async <T extends "utf8" | null>(
    filepath: string,
    encoding?: T
  ): Promise<T extends "utf8" ? string : Buffer> => {
    filepath = path.isAbsolute(filepath)
      ? filepath
      : path.resolve(path.join(__dirname, "../", filepath));
    return readFile(filepath, { encoding }) as any;
  };

  static loadFile = async (filepath: string) => {
    const { base, ext } = path.parse(filepath);
    return new File([await API.readFile(filepath, null)], base, {
      type: getMimeType(ext)
    });
  };

  static drop = async (blob: Blob) => {
    const fileDropEvent = createEvent.drop(GlobalTestState.canvas);
    const text = await new Promise<string>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsText(blob);
      } catch (error: any) {
        reject(error);
      }
    });

    const files = [blob] as File[] & { item: (index: number) => File };
    files.item = (index: number) => files[index];

    Object.defineProperty(fileDropEvent, "dataTransfer", {
      value: {
        files,
        getData: (type: string) => {
          if (type === blob.type) {
            return text;
          }
          return "";
        }
      }
    });
    fireEvent(GlobalTestState.canvas, fileDropEvent);
  };
}
