module.exports = {
  context: __dirname,
  entry: './script.jsx',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [ 'react', 'es2015' ]
        }
      }
    ]
  }
};
