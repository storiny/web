import { Flag, UserFlag } from "./flags";

const userFlagKeys = Object.keys(UserFlag).filter((key) =>
  Number.isNaN(parseInt(key))
);

const userFlagValues = Object.values(UserFlag).filter(
  (value) => typeof value === "number"
);

describe("flags", () => {
  it("returns `true` for the `none` method if there are no flags", () => {
    const flags = new Flag();
    expect(flags.none()).toBeTruthy();
  });

  it("constructs with a `0` flag by default", () => {
    const flags = new Flag();
    expect(flags.getFlags()).toEqual(0);
  });

  userFlagValues.forEach((flag, index) => {
    it(`works with \`${userFlagKeys[index]}\` flag`, () => {
      const flags = new Flag();
      flags.addFlag(flag as UserFlag);
      expect(flags.getFlags()).toEqual(flag);
    });
  });

  it("adds a new flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(flags.getFlags()).toEqual(1);
  });

  it("removes an existing flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(flags.getFlags()).toEqual(1);
    flags.removeFlag(UserFlag.STAFF);
    expect(flags.getFlags()).toEqual(0);
  });

  it("does not throw on a non existent flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(flags.getFlags()).toEqual(1);
    flags.removeFlag(UserFlag.VERIFIED);
    expect(flags.getFlags()).toEqual(1);
  });

  it("adds multiple flags", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    flags.addFlag(UserFlag.VERIFIED);
    expect(flags.getFlags()).toEqual(UserFlag.STAFF + UserFlag.VERIFIED);
  });

  it("removes a single flag from multiple flags", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    flags.addFlag(UserFlag.VERIFIED);
    expect(flags.getFlags()).toEqual(UserFlag.STAFF + UserFlag.VERIFIED);
    flags.removeFlag(UserFlag.VERIFIED);
    expect(flags.getFlags()).toEqual(UserFlag.STAFF);
  });

  it("returns `true` for a single existent flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(flags.hasAnyOf(UserFlag.STAFF)).toBeTruthy();
    expect(flags.hasAnyOf(UserFlag.VERIFIED)).toBeFalsy();
  });

  it("returns `true` for any of the existent flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(flags.hasAnyOf([UserFlag.STAFF, UserFlag.EARLY_USER])).toBeTruthy();
  });

  it("returns `true` for a list of existent flags", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    flags.addFlag(UserFlag.VERIFIED);
    expect(flags.hasAllOf([UserFlag.STAFF, UserFlag.VERIFIED])).toBeTruthy();
    expect(
      flags.hasAllOf([UserFlag.STAFF, UserFlag.VERIFIED, UserFlag.EARLY_USER])
    ).toBeFalsy();
  });

  it("returns `true` for a single non-existent flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(flags.notAnyOf(UserFlag.VERIFIED)).toBeTruthy();
    expect(flags.notAnyOf(UserFlag.STAFF)).toBeFalsy();
  });

  it("returns `true` for any of the non-existent flag", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    expect(
      flags.notAnyOf([UserFlag.VERIFIED, UserFlag.EARLY_USER])
    ).toBeTruthy();
  });

  it("returns `true` for a list of non-existent flags", () => {
    const flags = new Flag();
    flags.addFlag(UserFlag.STAFF);
    flags.addFlag(UserFlag.VERIFIED);
    expect(flags.notAllOf([UserFlag.STAFF, UserFlag.VERIFIED])).toBeFalsy();
    expect(
      flags.notAllOf([UserFlag.STAFF, UserFlag.VERIFIED, UserFlag.EARLY_USER])
    ).toBeTruthy();
  });
});
