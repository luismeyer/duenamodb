import test from 'ava';

import {
  expressionAttributeNameKey,
  expressionAttributeNames,
  expressionAttributeValueKey,
  expressionAttributeValues,
  conditionExpression,
  NOT,
  IN,
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
  const values = expressionAttributeValues({ foo: 'bar' });

  t.deepEqual(values, { ':foo': 'bar' });
});

test('Expression-Attribute-Value creates correct amount of entries', t => {
  const values = expressionAttributeValues({
    foo: 'bar',
    bar: 'foo',
    hello: 'world',
  });

  t.deepEqual(values, {
    ':foo': 'bar',
    ':bar': 'foo',
    ':hello': 'world',
  });
});

test('Expression-Attribute-Value handles duenamo expression NOT', t => {
  const values = expressionAttributeValues({
    foo: NOT('bar'),
  });

  t.deepEqual(values, { ':foo': 'bar' });
});

test('Expression-Attribute-Value handles duenamo expression IN', t => {
  const values = expressionAttributeValues({
    foo: IN('bar', 'baz'),
  });

  t.deepEqual(values, {
    ':foo_0': 'bar',
    ':foo_1': 'baz',
  });
});

test('Condition-Expression includes Name-Key and Value-Key', t => {
  const exp = conditionExpression({ foo: 'bar' });

  t.is(exp, '#foo = :foo');
});

test('Condition-Expression handles multiple Keys', t => {
  const exp = conditionExpression({
    foo: 'bar',
    bar: 'foo',
    hello: 'world',
    world: 'hello',
  });

  t.is(
    exp,
    '#foo = :foo and #bar = :bar and #hello = :hello and #world = :world'
  );
});

test('Condition-Expression handles duenamo expression NOT', t => {
  const exp = conditionExpression({
    foo: NOT('bar'),
  });

  t.is(exp, '#foo <> :foo');
});

test('Condition-Expression handles duenamo expression IN', t => {
  const exp = conditionExpression({
    foo: IN('bar', 'baz', 'hello', 'world'),
  });

  t.is(exp, '#foo IN (:foo_0, :foo_1, :foo_2, :foo_3)');
});
