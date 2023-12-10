import { RenderItemArgs } from "~/components/masonry";
import { GetUserAssetsResponse } from "~/redux/features";

export type LibraryItemProps = RenderItemArgs<GetUserAssetsResponse[number]> & {
  page: number;
};
