/**
 * Draws a rounded rectangle using the current state of the canvas
 * @see https://stackoverflow.com/a/3368118
 * @param context Canvas context
 * @param x Top left x coordinate
 * @param y Top left y coordinate
 * @param width Width of the rectangle
 * @param height Height of the rectangle
 * @param radius Corner radius
 * @param strokeColor Stroke color
 */
export const roundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeColor?: string
): void => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();

  if (strokeColor) {
    context.strokeStyle = strokeColor;
  }

  context.stroke();
};
