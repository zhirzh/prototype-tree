const { join } = require('path');

module.exports = {
  context: join(__dirname, 'src'),

  entry: './index',

  target: 'web',

  output: {
    path: join(__dirname, 'build'),
    filename: 'bundle.js',
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
