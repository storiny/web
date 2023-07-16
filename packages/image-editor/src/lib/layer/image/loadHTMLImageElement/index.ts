/**
 * Loads an image element
 * @param dataURL Data URL of the image
 */
export const loadHTMLImageElement = (
  dataURL: DataURL
): Promise<HTMLImageElement> =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = (): void => {
      resolve(image);
    };

    image.onerror = (error): void => {
      reject(error);
    };

    image.src = dataURL;
  });
