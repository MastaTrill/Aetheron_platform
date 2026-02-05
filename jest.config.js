// jest.config.js for ES module support
export default {
  testEnvironment: "node",
  transform: {}, // disables Babel, use if not needed
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {},
  globals: {},
};
