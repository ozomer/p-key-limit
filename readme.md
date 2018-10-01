# p-limit [![Build Status](https://travis-ci.org/ozomer/p-key-limit.svg?branch=master)](https://travis-ci.org/ozomer/p-key-limit)

> Run multiple promise-returning & async functions with limited concurrency by key.
> The package maintains a mapping of [p-limit](https://github.com/sindresorhus/p-limit) object per key, so when the limit is called with the same key the promises' execution will be limited (following the concurrency value) but when used with different keys the promises' execution will not limit each other. The package automatically deletes the [p-limit](https://github.com/sindresorhus/p-limit) objects when they are no longer needed.

## Install

```
$ npm install p-key-limit
```


## Usage

```js
const myDbWrapper = require('./my-db-wrapper'); // assumes to have an async function called getInfo.
const pKeyLimit = require('p-key-limit');

const limit = pKeyLimit(5);

// Each user gets its own "p-limit" queue and can execute 5 parallel info requests.
function getInfoForUser(userId, infoKey) {
    if (limit.getSize(userId) > 20) {
        // user is overflowing with requests!
        throw new Error("That's too much, man!");
    }
    return limit(userId, () => myDbWrapper.getInfo(infoKey))
}
```


## API

### pKeyLimit(concurrency)

Returns a `limit` function.

#### concurrency

Type: `number`<br>
Minimum: `1`

Concurrency limit.

### limit(key, fn, ...args)

Returns the promise returned by calling `fn(...args)`.

#### fn

Type: `Function`

Promise-returning/async function.

#### ...args

Any arguments to pass through to `fn`.

Support for passing arguments on to the `fn` is provided in order to be able to avoid creating unnecessary closures. You probably don't need this optimization unless you're pushing a *lot* of functions.

### limit.getSize(key)

Returns the number of promises that are currently running for the given key plus the number of promises that are currently queued for the given key. Useful to detect overflows.

## Related

- [p-limit](https://github.com/sindresorhus/p-limit) - Run multiple promise-returning & async functions with limited concurrency

## License

MIT © Oren Zomer
