const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

// Monorepo support: watch shared packages and resolve from root node_modules
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
];

// withUniwindConfig MUST be outermost wrapper
module.exports = withUniwindConfig(config, {
    cssEntryFile: "./global.css",
});
