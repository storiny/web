import { Story } from "../story";
import { PeerRole, User } from "../user";

export type CollaborationRequest = {
  created_at: string;
  id: string;
  role: PeerRole;
  story: Pick<Story, "id" | "title">;
  user: User | null; // Can be null if the user is soft-deleted or deactivated
};
