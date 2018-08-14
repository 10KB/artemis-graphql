const { resolve } = require('path');

module.exports = function ArtemisGraphql(moduleOptions) {
  this.extendBuild((config) => {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      use: {
        loader: 'graphql-tag/loader',
      },
    });
  });

  this.addPlugin({
    src: resolve(__dirname, 'src', 'plugin.js'),
    options: {
      browserUri: moduleOptions.browserUri,
      serverUri: moduleOptions.serverUri,
      graphqlFolder: moduleOptions.graphqlFolder || '~/graphql',
    },
  });
};
