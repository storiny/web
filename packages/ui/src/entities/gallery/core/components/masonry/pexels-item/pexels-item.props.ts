import { RenderItemArgs } from "src/components/masonry";
import { GetGalleryPhotosResponse } from "~/redux/features";

export type PexelsItemProps = RenderItemArgs<GetGalleryPhotosResponse[number]>;
