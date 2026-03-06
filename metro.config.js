const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for project paths containing spaces — Metro's URI-encoded
// paths break Node's require(). Force resolution from project root.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

config.watchFolders = [__dirname];

module.exports = config;
