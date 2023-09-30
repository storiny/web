import { Flag, UserFlag } from "./flags";

const USER_FLAG_KEYS = Object.keys(UserFlag).filter((key) =>
  Number.isNaN(parseInt(key))
);

const USER_FLAG_VALUES = Object.values(UserFlag).filter(
  (value) => typeof value === "number"
);

describe("flags", () => {
  it("returns `true` for the `none` method if there are no flags", () => {
    const flags = new Flag();
    expect(flags.none()).toBeTruthy();
  });

  it("constructs with a `0` flag by default", () => {
    const flags = new Flag();
    expect(flags.get_flags()).toEqual(0);
  });

  USER_FLAG_VALUES.forEach((flag, index) => {
    it(`works with \`${USER_FLAG_KEYS[index]}\` flag`, () => {
      const flags = new Flag();
      flags.add_flag(flag as UserFlag);
      expect(flags.get_flags()).toEqual(flag);
    });
  });

  it("adds a new flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(flags.get_flags()).toEqual(1);
  });

  it("removes an existing flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(flags.get_flags()).toEqual(1);
    flags.remove_flag(UserFlag.STAFF);
    expect(flags.get_flags()).toEqual(0);
  });

  it("does not throw on a non existent flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(flags.get_flags()).toEqual(1);
    flags.remove_flag(UserFlag.VERIFIED);
    expect(flags.get_flags()).toEqual(1);
  });

  it("adds multiple flags", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    flags.add_flag(UserFlag.VERIFIED);
    expect(flags.get_flags()).toEqual(UserFlag.STAFF + UserFlag.VERIFIED);
  });

  it("removes a single flag from multiple flags", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    flags.add_flag(UserFlag.VERIFIED);
    expect(flags.get_flags()).toEqual(UserFlag.STAFF + UserFlag.VERIFIED);
    flags.remove_flag(UserFlag.VERIFIED);
    expect(flags.get_flags()).toEqual(UserFlag.STAFF);
  });

  it("returns `true` for a single existent flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(flags.has_any_of(UserFlag.STAFF)).toBeTruthy();
    expect(flags.has_any_of(UserFlag.VERIFIED)).toBeFalsy();
  });

  it("returns `true` for any of the existent flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(
      flags.has_any_of([UserFlag.STAFF, UserFlag.EARLY_USER])
    ).toBeTruthy();
  });

  it("returns `true` for a list of existent flags", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    flags.add_flag(UserFlag.VERIFIED);
    expect(flags.has_all_of([UserFlag.STAFF, UserFlag.VERIFIED])).toBeTruthy();
    expect(
      flags.has_all_of([UserFlag.STAFF, UserFlag.VERIFIED, UserFlag.EARLY_USER])
    ).toBeFalsy();
  });

  it("returns `true` for a single non-existent flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(flags.not_any_of(UserFlag.VERIFIED)).toBeTruthy();
    expect(flags.not_any_of(UserFlag.STAFF)).toBeFalsy();
  });

  it("returns `true` for any of the non-existent flag", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    expect(
      flags.not_any_of([UserFlag.VERIFIED, UserFlag.EARLY_USER])
    ).toBeTruthy();
  });

  it("returns `true` for a list of non-existent flags", () => {
    const flags = new Flag();
    flags.add_flag(UserFlag.STAFF);
    flags.add_flag(UserFlag.VERIFIED);
    expect(flags.not_all_of([UserFlag.STAFF, UserFlag.VERIFIED])).toBeFalsy();
    expect(
      flags.not_all_of([UserFlag.STAFF, UserFlag.VERIFIED, UserFlag.EARLY_USER])
    ).toBeTruthy();
  });
});
