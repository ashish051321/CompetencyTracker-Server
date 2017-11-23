module.exports = {
    entry: "./public/scripts/src/j1.js",
    output: {
        path: __dirname+"/scripts/build",
        filename: "j1.build.js"
    },
    watch:true,
    module:{
      rules:[
        {//this is for ES6
          test: /\.js$/ ,
          loader: 'babel-loader',
          exclude: /node_modules$/,
          options: {presets: ['es2015'] }
        }

      ]
    }
};
