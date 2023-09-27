import { ContentType } from "@storiny/shared";
import { Asset } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/gallery";

export type GalleryUploadResponse = Asset;
export interface GalleryUploadPayload {
  id: string; // ID of the pexels image
}

export const { useUploadGalleryMutation: use_upload_gallery_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      uploadGallery: builder.mutation<
        GalleryUploadResponse,
        GalleryUploadPayload
      >({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: "POST",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: ["Asset"]
      })
    })
  });
