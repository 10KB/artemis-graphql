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
        src: resolve(__dirname, "src", "plugin.js"),
        options: {
            localUri: moduleOptions.localUri || "http://localhost:4000/api/grapqhl",
            serverUri: moduleOptions.serverUri || "http://localhost:4000/api/grapqhl",
            graphqlFolder: moduleOptions.graphqlFolder || "~/graphql"
      }
    });
};
