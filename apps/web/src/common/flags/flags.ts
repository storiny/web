import { UserFlag } from "@storiny/shared";
import { is_num } from "@storiny/shared/src/utils/is-num";

type Mask = UserFlag | UserFlag[];

export { UserFlag as UserFlag };

/**
 * Utility class for performing bitwise operations.
 */
export class Flag {
  /**
   * Ctor
   * @param flags Input flags
   */
  constructor(flags = 0) {
    if (!is_num(flags)) {
      throw new TypeError("Invalid user flags");
    }

    this._flags = flags;
  }

  /**
   * Flags
   * @private
   */
  private _flags: number;

  /**
   * Adds a new flag to the existing flags
   * @param flag The new flag to add
   */
  public add_flag(flag: UserFlag): void {
    this.validate_flag(flag);

    if (this._flags & flag) {
      return;
    }

    this._flags += flag;
  }

  /**
   * Removes a flag from the existing flags
   * @param flag The flag to remove
   */
  public remove_flag(flag: UserFlag): void {
    this.validate_flag(flag);

    if (!(this._flags & flag)) {
      return;
    }

    this._flags -= flag;
  }

  /**
   * Predicate method for checking whether any of the specified
   * flags exist among the flags
   * @param mask The flag to check
   */
  public has_any_of(mask: Mask): boolean {
    return this.test_flag(mask, false, false);
  }

  /**
   * Predicate method for checking whether all the flags exist
   * among the existing flags
   * @param mask The flags to check
   */
  public has_all_of(mask: Mask): boolean {
    return this.test_flag(mask, true, false);
  }

  /**
   * Predicate method for checking whether any of the specified
   * flags does not exist among the flags
   * @param mask The flag to check
   */
  public not_any_of(mask: Mask): boolean {
    return this.test_flag(mask, false, true);
  }

  /**
   * Predicate method for checking whether all the flags do
   * not exist among the existing flags
   * @param mask The flags to check
   */
  public not_all_of(mask: Mask): boolean {
    return this.test_flag(mask, true, true);
  }

  /**
   * Predicate method for checking whether there are no flags
   */
  public none(): boolean {
    return this._flags === 0;
  }

  /**
   * Returns all the flags
   */
  public get_flags(): number {
    return this._flags;
  }

  /**
   * Predicate method tests the existence of a flag or
   * mask among the existing flags
   * @param mask Flag or a list of flags
   * @param all Whether or not to check against 'all' or 'any' of the keys
   * @param inverse Whether or not to check if the user has the properties
   * @private
   */
  private test_flag(
    mask: Mask | number,
    all: boolean,
    inverse: boolean
  ): boolean {
    const flag_mask =
      typeof mask === "number"
        ? mask
        : Array.isArray(mask)
        ? this.get_mask(mask)
        : mask;

    let result: boolean;

    if (all) {
      result = (this._flags & flag_mask) === flag_mask;
    } else {
      result = !!(this._flags & flag_mask);
    }

    if (inverse) {
      result = !result;
    }

    return result;
  }

  /**
   * Checks for the validity of a flag
   * @param flag The flag to check
   * @private
   */
  private validate_flag(flag: UserFlag): void {
    if (!(flag in UserFlag)) {
      throw new Error(`"${flag}" is not a valid flag`);
    }
  }

  /**
   * Generates a mask
   * @param flags List of flags
   * @private
   */
  private get_mask(flags: UserFlag[]): number {
    let mask = 0;

    for (const flag in flags) {
      if (Object.prototype.hasOwnProperty.call(flags, flag)) {
        this.validate_flag(flags[flag]);
        mask += flags[flag];
      }
    }

    return mask;
  }
}
