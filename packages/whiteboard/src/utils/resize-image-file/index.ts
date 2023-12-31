/**
 * Resizes an image file for exporting
 * @param file File
 * @param opts Resize options
 */
export const resize_image_file = async (
  file: File,
  opts: {
    max_width_or_height: number;
  }
): Promise<File> => {
  const [pica, image_blob_reduce] = await Promise.all([
    import("pica").then((res) => res.default),
    // Wrapper for pica for better API
    import("image-blob-reduce").then((res) => res.default)
  ]);

  // CRA's minification settings break pica in WebWorkers, so let's disable
  // them for now https://github.com/nodeca/image-blob-reduce/issues/21#issuecomment-757365513
  const reduce = image_blob_reduce({
    pica: pica({ features: ["js", "wasm"] })
  });

  reduce._create_blob = async function (
    env
  ): Promise<{ out_blob: Blob; out_canvas: HTMLCanvasElement }> {
    // noinspection JSUnresolvedReference
    env.out_blob = await this.pica.toBlob(env.out_canvas, "image/png", 0.8);
    return env;
  };

  return new File(
    [await reduce.toBlob(file, { max: opts.max_width_or_height })],
    file.name,
    {
      type: "image/png"
    }
  );
};
