import test from 'ava';
import delay from 'delay';
import inRange from 'in-range';
import timeSpan from 'time-span';
import randomInt from 'random-int';
import m from '.';

test('keys: 2, concurrency: 1', async t => {
  const input = [
    ['a', 'a1', 300],
    ['a', 'a2', 200],
    ['a', 'a3', 100],
    ['b', 'b1', 310],
    ['b', 'b2', 210],
    ['b', 'b3', 110]
  ];
  const resultEvaluationOrder = [];

  const end = timeSpan();
  const limit = m(1);
  const mapper = ([key, val, ms]) => limit(key, () => delay(ms).then(() => {
    resultEvaluationOrder.push(val);
    return val;
  }));

  t.deepEqual(await Promise.all(input.map(mapper)), ['a1', 'a2', 'a3', 'b1', 'b2', 'b3']);
  t.deepEqual(resultEvaluationOrder, ['a1', 'b1', 'a2', 'b2', 'a3', 'b3']);

  t.true(inRange(end(), 620, 690));
});

test('keys: 4, concurrency: 5', async t => {
  const concurrency = 5;
  const runnings = [0, 0, 0, 0];

  const limit = m(concurrency);

  const input = Array.from({length: 100}, (_ignore, index) => limit(index % 4, async () => {
    runnings[index % 4]++;
    t.true(runnings[index % 4] <= concurrency);
    await delay(randomInt(30, 200));
    runnings[index % 4]--;
  }));

  await Promise.all(input);
});

test('non-promise returning function', async t => {
  await t.notThrows(async () => {
    const limit = m(1);
    await limit('mykey', () => null);
  });
});

test('continues after sync throw', async t => {
  const limit = m(1);
  let ranSameKey = false;
  let ranOtherKey = false;

  const promises = [
    limit('mykey', () => {
      throw new Error('err');
    }),
    limit('mykey', () => {
      ranSameKey = true;
    }),
    limit('myotherkey', () => {
      ranOtherKey = true;
    })
  ];

  await Promise.all(promises).catch(() => {});

  t.is(ranSameKey && ranOtherKey, true);
});

test('accepts additional arguments', async t => {
  const limit = m(1);
  const symbol = Symbol('test');

  await limit('mykey', a => t.is(a, symbol), symbol);
});

test('tests value of getSize', async t => {
  const limit = m(5);
  await Promise.all(['key1', 'key2', 'key3'].map(async key => {
    t.is(limit.getSize(key), 0);

    const runningPromise1 = limit(key, () => delay(1000));
    t.is(limit.getSize(key), 1);

    await runningPromise1;
    t.is(limit.getSize(key), 0);

    const immediatePromises = Array.from({length: 5}, () => limit(key, () => delay(1000)));
    const delayedPromises = Array.from({length: 3}, () => limit(key, () => delay(1000)));

    t.is(limit.getSize(key), 5 + 3);

    await Promise.all(immediatePromises);
    t.is(limit.getSize(key), 3);

    await Promise.all(delayedPromises);
    t.is(limit.getSize(key), 0);
  }));
});
