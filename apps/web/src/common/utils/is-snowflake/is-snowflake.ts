export type Snowflake = `${bigint}`;

const MAX_BIGINT = BigInt("9223372036854775807");

/**
 * Predicate function for determining snowflake IDs
 * @param id ID
 */
export const is_snowflake = (id: string): id is Snowflake => {
  try {
    return (
      BigInt(id).toString() === id && BigInt(id) <= MAX_BIGINT && BigInt(id) > 0
    );
  } catch {
    return false;
  }
};
