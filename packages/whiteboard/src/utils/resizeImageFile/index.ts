/**
 * Resizes an image file for exporting
 * @param file File
 * @param opts Resize options
 */
export const resizeImageFile = async (
  file: File,
  opts: {
    maxWidthOrHeight: number;
  }
): Promise<File> => {
  const [pica, imageBlobReduce] = await Promise.all([
    import("pica").then((res) => res.default),
    // Wrapper for pica for better API
    import("image-blob-reduce").then((res) => res.default)
  ]);

  // CRA's minification settings break pica in WebWorkers, so let's disable
  // them for now
  // https://github.com/nodeca/image-blob-reduce/issues/21#issuecomment-757365513
  const reduce = imageBlobReduce({
    pica: pica({ features: ["js", "wasm"] })
  });

  reduce._create_blob = function (
    env
  ): Promise<{ out_blob: Blob; out_canvas: HTMLCanvasElement }> {
    // noinspection JSUnresolvedReference
    return this.pica.toBlob(env.out_canvas, "image/png", 0.8).then((blob) => {
      env.out_blob = blob;
      return env;
    });
  };

  return new File(
    [await reduce.toBlob(file, { max: opts.maxWidthOrHeight })],
    file.name,
    {
      type: "image/png"
    }
  );
};
