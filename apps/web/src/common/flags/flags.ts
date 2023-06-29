import { UserFlag } from "@storiny/shared";

type Mask = UserFlag | UserFlag[];

export { UserFlag as UserFlag };

/**
 * Utility class for performing bitwise operations.
 */
export class Flag {
  private _flags: number;

  /**
   * Ctor
   * @param flags Input flags
   */
  constructor(flags: number = 0) {
    if (Number.isNaN(flags)) {
      throw new TypeError("Invalid user flags");
    }

    this._flags = flags;
  }

  /**
   * Adds a new flag to the existing flags
   * @param flag The new flag to add
   */
  public addFlag(flag: UserFlag): void {
    this.validateFlag(flag);

    if (this._flags & flag) {
      return;
    }

    this._flags += flag;
  }

  /**
   * Removes a flag from the existing flags
   * @param flag The flag to remove
   */
  public removeFlag(flag: UserFlag): void {
    this.validateFlag(flag);

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
  public hasAnyOf(mask: Mask): boolean {
    return this.testFlag(mask, false, false);
  }

  /**
   * Predicate method for checking whether all the flags exist
   * among the existing flags
   * @param mask The flags to check
   */
  public hasAllOf(mask: Mask): boolean {
    return this.testFlag(mask, true, false);
  }

  /**
   * Predicate method for checking whether any of the specified
   * flags does not exist among the flags
   * @param mask The flag to check
   */
  public notAnyOf(mask: Mask): boolean {
    return this.testFlag(mask, false, true);
  }

  /**
   * Predicate method for checking whether all the flags do
   * not exist among the existing flags
   * @param mask The flags to check
   */
  public notAllOf(mask: Mask): boolean {
    return this.testFlag(mask, true, true);
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
  public getFlags(): number {
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
  private testFlag(
    mask: Mask | number,
    all: boolean,
    inverse: boolean
  ): boolean {
    const flagMask =
      typeof mask === "number"
        ? mask
        : Array.isArray(mask)
        ? this.getMask(mask)
        : mask;

    let result: boolean;

    if (all) {
      result = (this._flags & flagMask) === flagMask;
    } else {
      result = !!(this._flags & flagMask);
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
  private validateFlag(flag: UserFlag): void {
    if (!(flag in UserFlag)) {
      throw new Error(`"${flag}" is not a valid flag`);
    }
  }

  /**
   * Generates a mask
   * @param flags List of flags
   * @private
   */
  private getMask(flags: UserFlag[]): number {
    let mask = 0;

    for (const flag in flags) {
      if (Object.prototype.hasOwnProperty.call(flags, flag)) {
        this.validateFlag(flags[flag]);
        mask += flags[flag];
      }
    }

    return mask;
  }
}
