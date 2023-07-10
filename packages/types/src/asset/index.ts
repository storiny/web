import { AssetRating } from "@storiny/shared";

import { User } from "../user";

interface AssetOptionalProps {
  user?: User;
}

export type Asset = {
  alt: string;
  created_at: string;
  favourite: boolean;
  height: number;
  hex: string;
  id: string;
  key: string;
  rating: AssetRating;
  user_id: string;
  width: number;
} & AssetOptionalProps;
