import { RenderItemArgs } from "~/components/Masonry";
import { GetUserAssetsResponse } from "~/redux/features";

export type LibraryItemProps = RenderItemArgs<GetUserAssetsResponse[number]>;
