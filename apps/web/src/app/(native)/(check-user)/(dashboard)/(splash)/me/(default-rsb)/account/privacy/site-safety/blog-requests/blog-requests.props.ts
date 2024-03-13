import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { BlogRequestsSchema } from "./blog-requests.schema";

export type BlogRequestsProps = {
  on_submit?: SubmitHandler<BlogRequestsSchema>;
} & Pick<GetPrivacySettingsResponse, "incoming_blog_requests">;
