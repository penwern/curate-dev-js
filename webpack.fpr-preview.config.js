const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const base = require("./webpack.config.js");

module.exports = (env, argv) => {
  const config = base(env, argv);
  config.entry = "./preview/fpr-preview.js";
  config.output.path = path.resolve(__dirname, "dist-fpr-preview");
  config.plugins.push(new HtmlWebpackPlugin({ template: "./preview/fpr-preview.html" }));
  config.devServer.port = 6901;
  config.devServer.static = [
    { directory: path.resolve(__dirname, "preview") },
    { directory: path.resolve(__dirname, "src/css"), publicPath: "/styles" },
  ];
  config.devServer.client.webSocketURL.port = 6901;
  return config;
};
