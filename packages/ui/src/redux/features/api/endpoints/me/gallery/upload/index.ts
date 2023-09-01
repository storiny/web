import { ContentType } from "@storiny/shared";
import { Asset } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/gallery";

export type GalleryUploadResponse = Asset;
export interface GalleryUploadPayload {
  id: string; // ID of the pexels image
}

export const { useGalleryUploadMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    galleryUpload: builder.mutation<
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
