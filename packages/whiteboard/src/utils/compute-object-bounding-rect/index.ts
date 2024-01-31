import { FabricObject, Point, TBBox, util } from "fabric";

/**
 * Computes bounding rect of a Fabric object
 * @param object The fabric object
 */
export const compute_object_bounding_rect = (object: FabricObject): TBBox => {
  const coords = object.oCoords;
  return util.makeBoundingBoxFromPoints([
    new Point(coords.tl.x, coords.tl.y),
    new Point(coords.tr.x, coords.tr.y),
    new Point(coords.br.x, coords.br.y),
    new Point(coords.bl.x, coords.bl.y)
  ]);
};
