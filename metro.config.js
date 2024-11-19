const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.assetExts.push("obj");
defaultConfig.resolver.assetExts.push("mtl");
defaultConfig.resolver.assetExts.push("blend");
defaultConfig.resolver.assetExts.push("glb");
defaultConfig.resolver.assetExts.push("png");
defaultConfig.resolver.assetExts.push("jpg");
defaultConfig.transformer.assetPlugins = ["expo-asset/tools/hashAssetFiles"];
module.exports = defaultConfig;
