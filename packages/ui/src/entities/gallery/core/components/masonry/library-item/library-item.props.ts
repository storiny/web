import { RenderItemArgs } from "src/components/masonry";
import { GetUserAssetsResponse } from "~/redux/features";

export type LibraryItemProps = RenderItemArgs<GetUserAssetsResponse[number]>;
