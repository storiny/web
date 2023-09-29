import { AccountActivityType } from "@storiny/shared";
import { AccountActivity } from "@storiny/types";

import { DateFormat, format_date } from "src/utils/format-date";

export const TEST_ACCOUNT_ACTIVITY: AccountActivity = {
  type: AccountActivityType.ACCOUNT_CREATION,
  description: "test activity",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

export const MOCK_ACCOUNT_ACTIVITIES: AccountActivity[] = [
  {
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665205556338688",
    type: AccountActivityType.EMAIL,
    description: "You changed your e-mail address to <m>example@domain.tld</m>"
  },
  {
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877680534708228",
    type: AccountActivityType.USERNAME,
    description: "You changed your username to <m>@horton</m>"
  },
  {
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637300061766836224",
    type: AccountActivityType.PASSWORD,
    description: "You updated your password."
  },
  {
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667558539886592",
    type: AccountActivityType.PASSWORD,
    description: "You added a password to your account."
  },
  {
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1662662933439021056",
    type: AccountActivityType.THIRD_PARTY_LOGIN,
    description: "You removed <m>Google</m> as a third-party login method."
  },
  {
    created_at: "2023-02-03T01:07:02.000Z",
    id: "1662654838398697472",
    type: AccountActivityType.MFA,
    description: "You enabled two-factor authentication for your account."
  },
  {
    created_at: "2022-11-23T01:07:02.000Z",
    id: "1662640969630781442",
    type: AccountActivityType.PRIVACY,
    description: "You made your account <m>public</m>."
  },
  {
    created_at: "2021-09-04T01:07:02.000Z",
    id: "1662644286867775488",
    type: AccountActivityType.PRIVACY,
    description: "You made your account <m>private</m>."
  },
  {
    created_at: "2022-07-13T01:07:02.000Z",
    id: "1662597389759266819",
    type: AccountActivityType.DATA_EXPORT,
    description: "You requested a copy of your account data."
  },
  {
    created_at: "2022-01-24T01:07:02.000Z",
    id: "1662482155996364800",
    type: AccountActivityType.ACCOUNT_CREATION,
    description: `You created this account on <m>${format_date(
      "2022-01-24T01:07:02.000Z",
      DateFormat.STANDARD
    )}</m>.`
  }
];
