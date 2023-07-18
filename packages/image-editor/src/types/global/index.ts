type TEXtChunk = { data: Uint8Array; name: "tEXt" };

/**
 * @see https://github.com/nodeca/image-blob-reduce/issues/23#issuecomment-783271848
 */
declare module "image-blob-reduce" {
  import { Pica, PicaResizeOptions } from "pica";
  namespace ImageBlobReduce {
    interface ImageBlobReduce {
      _create_blob(
        this: { pica: Pica },
        env: {
          out_blob: Blob;
          out_canvas: HTMLCanvasElement;
        }
      ): Promise<any>;
      toBlob(file: File, options: ImageBlobReduceOptions): Promise<Blob>;
    }

    interface ImageBlobReduceStatic {
      new (options?: any): ImageBlobReduce;
      (options?: any): ImageBlobReduce;
    }

    interface ImageBlobReduceOptions extends PicaResizeOptions {
      max: number;
    }
  }

  const reduce: ImageBlobReduce.ImageBlobReduceStatic;
  export = reduce;
}

declare module "png-chunk-text" {
  function encode(
    name: string,
    value: string
  ): { data: Uint8Array; name: "tEXt" };
  function decode(data: Uint8Array): { keyword: string; text: string };
}

declare module "png-chunks-encode" {
  function encode(chunks: TEXtChunk[]): Uint8Array;
  export = encode;
}

declare module "png-chunks-extract" {
  function extract(buffer: Uint8Array): TEXtChunk[];
  export = extract;
}
