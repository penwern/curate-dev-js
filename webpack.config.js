const path = require("path");
const webpack = require("webpack");
const fs = require("fs-extra"); // You'll need fs-extra to copy files
const packageJson = require("./package.json");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/js/index.js",
  output: {
    // Main entry file will have the version number
    filename: "[name]_" + packageJson.version + ".js",
    // Other chunk files will be handled by chunkFilename
    chunkFilename: "[name].[chunkhash].js", // Keep chunk hash for cache busting
    path: path.resolve(__dirname, "dist", packageJson.version), // Version-specific output directory
    globalObject: "this",
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.VERSION": JSON.stringify(packageJson.version),
    }),
    // Custom plugin to handle the creation of the @latest folder AND ReplayWeb service worker
    {
      apply(compiler) {
        compiler.hooks.afterEmit.tapAsync(
          "CopyLatestBuildAndReplayWorker",
          (compilation, callback) => {
            const versionDir = path.resolve(
              __dirname,
              "dist",
              packageJson.version
            );
            const latestDir = path.resolve(__dirname, "dist", "@latest");
            s;

            // Copy versioned files to @latest folder without version numbers
            fs.readdir(versionDir, (err, files) => {
              if (err) {
                console.error("Error reading versioned files:", err);
                return callback();
              }

              files.forEach((file) => {
                // Skip the replay directory since we already handled it
                if (file === "replay") return;

                const sourcePath = path.resolve(versionDir, file);
                const targetPath = path.resolve(
                  latestDir,
                  file.replace(`_${packageJson.version}.js`, ".js")
                );

                // Copy each file to the @latest folder with the correct filename
                fs.copy(sourcePath, targetPath, (copyErr) => {
                  if (copyErr) {
                    console.error(
                      `Error copying file to @latest: ${file}`,
                      copyErr
                    );
                  } else {
                    console.log(`Successfully copied ${file} to @latest`);
                  }
                });
              });
              callback(); // Don't forget to call callback to signal Webpack we're done
            });
          }
        );
      },
    },
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
    minimize: true,
    minimizer: [new TerserPlugin()],
    // The splitChunks block is now gone
  },
};
