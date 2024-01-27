import test from 'ava';

import {
  expressionAttributeNameKey,
  expressionAttributeNames,
  expressionAttributeValueKey,
  expressionAttributeValues,
  conditionExpression,
} from '../src';

test('Expression-Attribute-Name-Key includes key value', t => {
  const nameKey = expressionAttributeNameKey('foo');

  t.is(nameKey, '#foo');
});

test('Expression-Attribute-Value-Key includes key value', t => {
  const valueKey = expressionAttributeValueKey('foo');

  t.is(valueKey, ':foo');
});

test('Expression-Attribute-Value-Key and Expression-Attribute-Name-Key differ', t => {
  const valueKey = expressionAttributeValueKey('foo');
  const nameKey = expressionAttributeNameKey('foo');

  t.not(valueKey, nameKey);
});

test('Expression-Attribute-Names creates correct mapping', t => {
  const names = expressionAttributeNames(['foo']);

  t.deepEqual(names, { '#foo': 'foo' });
});

test('Expression-Attribute-Names creates correct amount of entries', t => {
  const names = expressionAttributeNames(['foo', 'bar', 'hello', 'world']);

  t.deepEqual(names, {
    '#foo': 'foo',
    '#bar': 'bar',
    '#hello': 'hello',
    '#world': 'world',
  });
});

test('Expression-Attribute-Values creates correct mapping', t => {
  const values = expressionAttributeValues({ foo: 'bar' }, ['foo']);

  t.deepEqual(values, { ':foo': 'bar' });
});

test('Expression-Attribute-Value creates correct amount of entries', t => {
  const values = expressionAttributeValues(
    { foo: 'bar', bar: 'foo', hello: 'world' },
    ['foo', 'bar', 'hello']
  );

  t.deepEqual(values, {
    ':foo': 'bar',
    ':bar': 'foo',
    ':hello': 'world',
  });
});

test('Condition-Expression includes Name-Key and Value-Key', t => {
  const exp = conditionExpression(['foo']);

  t.is(exp, '#foo = :foo');
});

test('Condition-Expression handles multiple Keys', t => {
  const exp = conditionExpression(['foo', 'bar', 'hello', 'world']);

  t.is(
    exp,
    '#foo = :foo and #bar = :bar and #hello = :hello and #world = :world'
  );
});
