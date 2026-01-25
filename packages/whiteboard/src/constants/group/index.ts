import { Group } from "fabric";

export const COMMON_GROUP_PROPS: NonNullable<
  ConstructorParameters<typeof Group>[1]
> = {
  cornerColor: "#fff",
  borderOpacityWhenMoving: 0.25,
  cornerSize: 10,
  borderScaleFactor: 1.5,
  borderColor: "#1371ec",
  cornerStrokeColor: "#1371ec",
  transparentCorners: false,
  lockRotation: true
};
