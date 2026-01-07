const defineJestConfig = require("../../../define_jest_config")
module.exports = defineJestConfig({
  moduleNameMapper: {
    "^@models": "<rootDir>/src/models",
    "^@services": "<rootDir>/src/services",
    "^@types": "<rootDir>/src/types",
  },
})
