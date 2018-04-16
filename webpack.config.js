const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/js/index.js', //Where the bundle starts from
    output: { //path and name of the bundle file
        path: path.resolve(__dirname, 'dist'), //This path is a node package, __dirname is accessible thanks to node
        filename: 'js/bundle.js'
    },
    devServer: {
        contentBase: './dist'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html'
        })
    ]
};