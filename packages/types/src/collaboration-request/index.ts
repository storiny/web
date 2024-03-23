import { DocUserRole, Story } from "../story";
import { User } from "../user";

export type CollaborationRequest = {
  created_at: string;
  id: string;
  role: Exclude<DocUserRole, "reader" | "blog-member">;
  story: Pick<Story, "id" | "title">;
  user: User | null; // Can be null if the user is soft-deleted or deactivated
};
