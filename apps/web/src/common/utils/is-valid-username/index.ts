import { USER_PROPS } from "@storiny/shared";

/**
 * Predicate function for validating usernames
 * @param username Username
 */
export const is_valid_username = (username = ""): boolean =>
  !(
    username.length < USER_PROPS.username.min_length ||
    username.length > USER_PROPS.username.max_length
  );
