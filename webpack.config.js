const webpack = require("webpack");

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const StringReplacePlugin = require("string-replace-webpack-plugin");

const UNASSERT_RULE = {
    test: /\.js$/,
    use: [{
        loader: StringReplacePlugin.replace({
            replacements: [
                {
                    pattern: /\n[ \t]*assert(\.[a-zA-Z0-9_]+)?\([^\);]+[\)\s]+[ \t]*[;\n]/g,
                    replacement: function (match, p1, offset, string) {
                        //strip
                        return "";
                    }
                }
            ]
        })
    }]
};

module.exports = (env, argv) => {
    const moduleRules = [];
    const plugins = [];

    const defines = {
        ENV_PRODUCTION: false
    };


    if (argv.mode === 'production') {
        defines.ENV_PRODUCTION = true;
        moduleRules.push(UNASSERT_RULE);
        plugins.push(new StringReplacePlugin())
    }


    plugins.push(new webpack.DefinePlugin(defines));

    return {
        entry: './src/demo.js',
        output: {
            path: path.resolve(__dirname, 'public'),
            filename: 'bundle.js'
        },
        plugins,
        module: {
            rules: moduleRules
        },
        //resolution configuration
        resolve: {},
        node: { module: "empty", net: "empty", fs: "empty" },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: false, // Must be set to true if using source-maps in production
                    terserOptions: {
                        // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                        compress: {
                            passes: 3,
                            keep_infinity: true
                        }
                    }
                }),
            ],
        },
        devtool: "source-map",
        //mode values: [production, development]
        mode: 'development',
        devServer: {
            contentBase: path.join(__dirname, 'public'),
            compress: true,
            port: 9000
        }
    };
};
