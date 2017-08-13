/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const parseGithubURL = require('parse-github-url');
const hasNodeDepModules = require('./has-node-dep-modules');
const packageConfig = require('../package.json');

const resolve = relPath => path.resolve(__dirname, relPath);

module.exports = {
  entry: {
    app: ['babel-polyfill', './index.js']
  },
  output: {
    path: resolve('../build'),
    publicPath: './',
    filename: '[name].js'
  },
  context: resolve('../src'),
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: { extractCSS: true }
      },
      {
        test: /\.s?css$/,
        include: resolve('../src'),
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: { sourceMap: true }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                config: { path: resolve('./postcss.config.js') }
              }
            },
            {
              loader: 'sass-loader',
              options: { sourceMap: true }
            }
          ]
        })
      },
      {
        test: /\.m?js$/,
        include: resolve('../src'),
        use: { loader: 'babel-loader' }
      },
      {
        test: /\.m?js$/,
        include: hasNodeDepModules,
        use: { loader: 'babel-loader' }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: {
          loader: 'url-loader',
          options: { limit: 8192 }
        }
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css',
      disable: false,
      allChunks: true
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html'
    }),
    new webpack.DefinePlugin({
      APP_VERSION: JSON.stringify(packageConfig.version),
      REPOSITORY_URL: JSON.stringify(
        (() => {
          const repo = packageConfig.repository;
          if (!repo) throw new Error("Cannot find the project's repository");
          const parsed = parseGithubURL(repo.url || repo);
          return `https://github.com/${parsed.repository}`;
        })()
      )
    })
  ]
};
