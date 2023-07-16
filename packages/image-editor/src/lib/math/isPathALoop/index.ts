import { LINE_CONFIRM_THRESHOLD } from "../../../constants/new";
import { LinearLayer, Zoom } from "../../../types";
import { distance2d } from "../distance2d";

/**
 * Checks if the first and last points are close
 * enough to be considered a loop
 * @param points Layer points
 * @param zoomValue Zoom value, supply if we want the loop detection to account
 * for current zoom
 */
export const isPathALoop = (
  points: LinearLayer["points"],
  zoomValue: Zoom["value"] = 1
): boolean => {
  if (points.length >= 3) {
    const [first, last] = [points[0], points[points.length - 1]];
    const distance = distance2d(first[0], first[1], last[0], last[1]);

    // Adjusting LINE_CONFIRM_THRESHOLD to current zoom so that when zoomed in
    // really close, we make the threshold smaller, and vice versa.
    return distance <= LINE_CONFIRM_THRESHOLD / zoomValue;
  }

  return false;
};
