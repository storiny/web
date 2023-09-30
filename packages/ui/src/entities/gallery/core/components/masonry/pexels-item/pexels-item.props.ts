import { RenderItemArgs } from "~/components/masonry";
import { GetGalleryPhotosResponse } from "~/redux/features";

export type PexelsItemProps = RenderItemArgs<GetGalleryPhotosResponse[number]>;
