const path = require("path");
const webpack = require("webpack");
const packageJson = require("./package.json");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: "./src/js/index.js",
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      buildDependencies: {
        config: [__filename],
        packageLock: ['./package-lock.json'],
      },
    },
    output: {
      filename: "[name].js",
      chunkFilename: "[name].[chunkhash].js",
      path: path.resolve(__dirname, "dist"),
      globalObject: "this",
      clean: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.VERSION": JSON.stringify(packageJson.version),
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "node_modules/replaywebpage/sw.js"),
            to: path.resolve(__dirname, "dist/replaywebpage-sw.js"),
          },
          {
            from: path.resolve(__dirname, "node_modules/replaywebpage/ui.js"),
            to: path.resolve(__dirname, "dist/replaywebpage-ui.js"),
          },
          {
            from: path.resolve(__dirname, "node_modules/spark-md5/spark-md5.js"),
            to: path.resolve(__dirname, "dist/spark-md5.js"),
          },
        ],
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules\/(?!(@material\/web|lit|vest)\/).*/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", ["@babel/preset-react", { runtime: "classic" }]],
              // Add cacheDirectory for faster rebuilds in development
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.worker\.js$/,
          include: [path.resolve(__dirname, "src/js/workers")],
          use: {
            loader: "worker-loader",
            options: {
              filename: "[name].[hash].worker.js",
            },
          },
        },
      ],
    },
    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? [new TerserPlugin()] : [],
    },
    // Add watchOptions at the top level
    watchOptions: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/.webpack-cache/**',
        '**/coverage/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/logs/**',
        '**/*.log',
        '**/tmp/**',
        '**/temp/**',
        '**/.claude/**'
      ],
      aggregateTimeout: 300,
      poll: false
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      host: '0.0.0.0', // Listen on all network interfaces
      port: 6900,
      hot: true,
      liveReload: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
      allowedHosts: 'all', // Allow connections from any host
      client: {
        webSocketURL: {
          hostname: 'localhost', // Connect to local dev server
          port: 6900,
          protocol: 'ws', // Use ws:// for local development
          pathname: '/ws',
        },
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: (error) => {
            // Ignore benign ResizeObserver errors that occur during Lit component updates
            if (error.message && error.message.includes('ResizeObserver loop')) {
              return false;
            }
            return true;
          },
        },
      },
    },
  };
};
