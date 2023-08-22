// Flag bits, always a power of 2 (2, 4, 8, ...)
export enum UserFlag {
  STAFF /*                */ = 1,
  TEMPORARILY_SUSPENDED /**/ = 2,
  PERMANENTLY_SUSPENDED /**/ = 4,
  VERIFIED /*             */ = 8,
  EARLY_USER /*           */ = 16
}
