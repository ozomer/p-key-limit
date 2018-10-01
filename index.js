'use strict';
const pLimit = require('p-limit');

module.exports = concurrency => {
  if (!(concurrency >= 1)) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up');
  }
  const cache = new Map();
  const generator = async (key, ...args) => {
    if (!cache.has(key)) {
      cache.set(key, {
        count: 0,
        limit: pLimit(concurrency)
      });
    }
    const limiter = cache.get(key);
    try {
      limiter.count += 1;
      return await limiter.limit(...args);
    } finally {
      limiter.count -= 1;
      if (limiter.count === 0) {
        cache.delete(key);
      }
    }
  };
  generator.getSize = key => {
    const limiter = cache.get(key);
    return (limiter ? limiter.count : 0);
  };
  return generator;
};
