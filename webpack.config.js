const path = require('path');

module.exports = {
  entry: '/octoprint_react_playground/static/jssrc/react_playground.js',
  mode: 'development',  // TODO build in production to test performance?
  output: {
    filename: 'react_playground.js',
      path: path.resolve(__dirname, 'octoprint_react_playground/static/jsout')
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      }
    ]
  }
};
