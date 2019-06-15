const fs = require("fs")
const path = require("path")
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

module.exports = {
    bail: true,
    mode: "production",
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js",
        path: __dirname + "/../dist"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [{
            test: /\.ts$/,
            enforce: "pre",
            use: [{
                loader: "tslint-loader",
                options: {
                    failOnHint: true,
                    emitWarning: true
                }
            }]
        },
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader"
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },

    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
            tsconfig: resolveApp("tsconfig.json"),
            tslint: resolveApp("tslint.json"),
        }),
        new Dotenv(),
        new CopyPlugin([
            {
                from: 'src/icons', to: 'icons'
            },
            {
                from: 'src/manifest.json'
            },
            {
                from: 'src/hot-reload.js'
            }
        ])
    ],

    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty',
    },
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
        hints: "warning",
    }
}