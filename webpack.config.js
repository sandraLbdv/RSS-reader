const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index_bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
  devServer: {
    contentBase: './dist',
  },

  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'postcss-loader', 
            options: {
              plugins: function () {
                return [
                  require('autoprefixer')
                ];
              }
            },
          },
          { loader: 'sass-loader' },
        ],
      },
      { test: /\.(js)$/, use: 'babel-loader' },
    ],
  },
};
