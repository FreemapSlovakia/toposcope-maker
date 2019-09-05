# Toposcope Maker

Web app for making toposcopes.

## Compiling and running in the dev mode
```
npm i
./node_modules/.bin/webpack --config webpack-app.config.js --watch
# for library: ./node_modules/.bin/webpack --config webpack-library.config.js --watch
```

Run in different console:
```
npx http-server
```

## Compiling for the production

```
npm i
NODE_ENV=production ./node_modules/.bin/webpack --config webpack-app.config.js
NODE_ENV=production ./node_modules/.bin/webpack --config webpack-library.config.js
```

## Library

If compiled with `webpack-library.config.js` then you can include toposcope as a library to your code with `<script src="build/library.js"></script>`.
See `library-demo.html` for reference usage.
