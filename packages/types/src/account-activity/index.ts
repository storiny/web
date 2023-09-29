import { AccountActivityType } from "@storiny/shared";

export type AccountActivity = {
  created_at: string;
  description: string;
  id: string;
  type: AccountActivityType;
};
