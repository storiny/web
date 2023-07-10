import { RenderItemArgs } from "~/components/Masonry";
import { GetGalleryPhotosResponse } from "~/redux/features";

export type PexelsItemProps = RenderItemArgs<GetGalleryPhotosResponse[number]>;
