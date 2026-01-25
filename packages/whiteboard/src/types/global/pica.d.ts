// https://github.com/nodeca/image-blob-reduce/issues/23#issuecomment-783271848
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
