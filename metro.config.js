const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return context.resolveRequest(
        context,
        `${__dirname}/__mocks__/react-native-maps/index.js`,
        platform,
      );
    }
    if (moduleName === 'react-native-webview') {
      return context.resolveRequest(
        context,
        `${__dirname}/__mocks__/react-native-webview/index.js`,
        platform,
      );
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
