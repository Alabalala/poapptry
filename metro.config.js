const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// 1. Get the default config
const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

// 2. Add pnpm support: Tell Metro to watch the workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..'); // Adjust if in a monorepo, otherwise use __dirname

config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Ensure Metro can find the entry point
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './src/global.css' });