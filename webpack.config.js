const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const ZipPlugin = require('zip-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Package = require('./package.json');
const Manifest = require('./src/_metadata/manifest.json');

const TARGET = process.env.npm_lifecycle_event;

const common = {
  entry: {
    devtools: './src/devtools/devtools.js',
    panel: './src/devtools/panel.js'
  },
  output: {
    path: path.resolve(__dirname, './build/dist'),
    filename: '[name].js',
    clean: true
  },
  // Manifest V3 extension pages forbid eval, so never use eval-based source maps
  devtool: false,
  resolve: {
    // xml2js depends on these Node built-ins, which webpack 5 no longer polyfills
    fallback: {
      events: require.resolve('events/'),
      timers: require.resolve('timers-browserify'),
      stream: false,
      string_decoder: false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /\.(eot|ttf|woff|woff2|svg)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['devtools'],
      filename: 'devtools.html'
    }),
    new HtmlWebpackPlugin({
      chunks: ['panel'],
      template: './src/devtools/panel.html',
      filename: 'panel.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/_metadata/locales', to: '_locales' },
        { from: './src/_metadata/img', to: 'img' },
        { from: './src/_metadata/manifest.json' }
      ]
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      jquery: 'jquery'
    })
  ]
}

if(TARGET === 'start' || !TARGET) {
  module.exports = merge(common, {
    mode: 'development',
    watch: true
  });
}

if(TARGET === 'build') {
  module.exports = merge(common, {
    mode: 'production',
    performance: {
      hints: false
    },
    plugins: [
      new webpack.ProgressPlugin(),
      new ZipPlugin({
        path: '../packages',
        filename: `${Package.name}-${Manifest.version}.zip`
      })
    ]
  });
}
