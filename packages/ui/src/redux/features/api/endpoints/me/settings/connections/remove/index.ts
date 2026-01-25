import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/settings/connections/${id}`;

export interface RemoveConnectionPayload {
  id: string;
}

export const { useRemoveConnectionMutation: use_remove_connection_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      removeConnection: builder.mutation<void, RemoveConnectionPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        })
      })
    })
  });
