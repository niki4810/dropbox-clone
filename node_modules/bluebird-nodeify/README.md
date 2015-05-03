# Nodeify

Use `bluebird`'s `promise.nodeify(callback)` method as a function to convert non-bluebird promises to node style callbacks.

## Installation

  Server:

    $ npm install bluebird-nodeify

## Usage

### Functional

Call `nodeify` directly passing the `promise`, `callback` and an optional `options` argument.

```javascript
var nodeify = require('bluebird-nodeify')

function myAsyncMethod(arg, callback) {
  return nodeify(myPromiseMethod(arg), callback)
}
```

See the [bluebird docs](https://github.com/petkaantonov/bluebird/blob/master/API.md#nodeifyfunction-callback--object-options---promise) for full feature set and supported options like [spread](https://github.com/petkaantonov/bluebird/blob/master/API.md#option-spread).
