export enum LayerType {
  ARROW = "arrow",
  ELLIPSE = "ellipse",
  IMAGE = "image",
  LINE = "line",
  MAIN_IMAGE = "main-image",
  POLYGON = "polygon",
  RECTANGLE = "rectangle",
  TEXT = "text"
}

export interface Layer {
  hidden: boolean;
  id: string;
  locked: boolean;
  name: string;
  type: LayerType;
}
