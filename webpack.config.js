const path = require("path");
const webpack = require("webpack");
const fs = require("fs-extra");
const packageJson = require("./package.json");
const TerserPlugin = require("terser-webpack-plugin");

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
      // In development, output to dist root for easier dev server serving
      // In production, output to versioned directory
      filename: isProduction
        ? `[name]_${packageJson.version}.js`
        : `[name].js`,
      chunkFilename: "[name].[chunkhash].js",
      path: isProduction
        ? path.resolve(__dirname, "dist", packageJson.version)
        : path.resolve(__dirname, "dist"),
      globalObject: "this",
      clean: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.VERSION": JSON.stringify(packageJson.version),
      }),

      // Only run the custom plugin in production mode
      ...(isProduction ? [{
        apply(compiler) {
          compiler.hooks.afterEmit.tapAsync(
            "CopyLatestBuild",
            (_, callback) => {
              const versionDir = path.resolve(
                __dirname,
                "dist",
                packageJson.version
              );
              const latestDir = path.resolve(__dirname, "dist", "@latest");

              // Make sure the @latest folder exists
              fs.emptyDirSync(latestDir);

              fs.readdir(versionDir, (err, files) => {
                if (err) {
                  console.error("Error reading versioned files:", err);
                  return callback();
                }

                const copyPromises = files.map(file => {
                  const sourcePath = path.resolve(versionDir, file);
                  const targetPath = path.resolve(
                    latestDir,
                    file.replace(`_${packageJson.version}.js`, ".js")
                  );

                  return fs.copy(sourcePath, targetPath).then(() => {
                    console.log(`Successfully copied ${file} to @latest`);
                  }).catch(copyErr => {
                    console.error(`Error copying file to @latest: ${file}`, copyErr);
                  });
                });

                Promise.all(copyPromises).then(() => callback()).catch(() => callback());
              });
            }
          );
        },
      }] : []),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!(@material\/web|lit)\/).*/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
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
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      port: 6900,
      hot: true,
      watchFiles: ['src/**/*'],
      liveReload: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      allowedHosts: [
        '.penwern.co.uk',
        'localhost'
      ]
    },
  };
};