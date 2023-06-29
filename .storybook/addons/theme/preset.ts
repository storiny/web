export const managerEntries = (entry = []) => [
  ...entry,
  require.resolve("./register"),
];
