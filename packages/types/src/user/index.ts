import { StatusDuration, StatusVisibility } from "@storiny/shared";

import { Connection } from "../connection";

export interface UserStatus {
  duration: StatusDuration;
  emoji: string | null;
  expires_at: string | null;
  text: string | null;
  visibility: StatusVisibility;
}

interface UserStatistics {
  follower_count: number;
  following_count: number | null;
  friend_count: number | null;
  story_count: number;
}

interface UserLoginProps {
  login_apple_id?: string | null;
  login_google_id?: string | null;
}

interface UserOptionalProps {
  connections?: Connection<false>[];
  email?: string;
  mfa_enabled?: boolean; // Multifactor auth
  mfa_secret?: string | null; // MFA secret
  password?: string | null;
  username_modified_at?: string | null;
}

interface UserSpecificUserProps {
  is_blocked_by_user?: boolean;
  is_blocking?: boolean;
  is_follower?: boolean;
  is_following?: boolean;
  is_friend?: boolean;
  is_friend_request_sent?: boolean;
  is_muted?: boolean;
  is_subscribed?: boolean;
}

export type User = {
  avatar_hex: string | null;
  avatar_id: string | null;
  banner_hex: string | null;
  banner_id: string | null;
  bio: string;
  created_at: string;
  id: string;
  is_private: boolean;
  location: string;
  name: string;
  public_flags: number;
  status: UserStatus | null;
  username: string;
  wpm: number; // Default `225`
} & UserStatistics &
  UserOptionalProps &
  UserSpecificUserProps &
  UserLoginProps;
