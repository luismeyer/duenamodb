import test from "ava";
import {
	expressionAttributeNameKey,
	expressionAttributeValueKey,
	NOT,
	IN,
	AND,
	createConditionExpression,
} from "../src";

test("Expression-Attribute-Name-Key includes key value", (t) => {
	const nameKey = expressionAttributeNameKey("foo");

	t.is(nameKey, "#foo");
});

test("Expression-Attribute-Value-Key includes key value", (t) => {
	const valueKey = expressionAttributeValueKey("foo");

	t.is(valueKey, ":foo");
});

test("Expression-Attribute-Value-Key and Expression-Attribute-Name-Key differ", (t) => {
	const valueKey = expressionAttributeValueKey("foo");
	const nameKey = expressionAttributeNameKey("foo");

	t.not(valueKey, nameKey);
});

test("creates correct amount of entries", (t) => {
	const { attributeValues, attributeNames, expression } =
		createConditionExpression({
			foo: "bar",
			bar: "foo",
			hello: "world",
		});

	t.deepEqual(attributeValues, {
		":foo": "bar",
		":bar": "foo",
		":hello": "world",
	});
	t.deepEqual(attributeNames, {
		"#foo": "foo",
		"#bar": "bar",
		"#hello": "hello",
	});
	t.is(expression, "(#foo = :foo) and (#bar = :bar) and (#hello = :hello)");
});

test("includes Name-Key and Value-Key", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({ foo: "bar" });

	t.is(expression, "(#foo = :foo)");
	t.deepEqual(attributeNames, {
		"#foo": "foo",
	});
	t.deepEqual(attributeValues, {
		":foo": "bar",
	});
});

test("handles multiple Keys", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			foo: "bar",
			bar: "foo",
			hello: "world",
			world: "hello",
		});

	t.is(
		expression,
		"(#foo = :foo) and (#bar = :bar) and (#hello = :hello) and (#world = :world)",
	);
	t.deepEqual(attributeNames, {
		"#foo": "foo",
		"#bar": "bar",
		"#hello": "hello",
		"#world": "world",
	});
	t.deepEqual(attributeValues, {
		":foo": "bar",
		":bar": "foo",
		":hello": "world",
		":world": "hello",
	});
});

test("handles duenamo expression NOT", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			foo: NOT("bar"),
		});

	t.is(expression, "(#foo <> :not_foo)");
	t.deepEqual(attributeNames, {
		"#foo": "foo",
	});
	t.deepEqual(attributeValues, {
		":not_foo": "bar",
	});
});

test("handles duenamo expression IN", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			foo: IN("bar", "baz", "hello", "world"),
		});

	t.is(expression, "(#foo IN (:foo_in0, :foo_in1, :foo_in2, :foo_in3))");
	t.deepEqual(attributeNames, {
		"#foo": "foo",
	});
	t.deepEqual(attributeValues, {
		":foo_in0": "bar",
		":foo_in1": "baz",
		":foo_in2": "hello",
		":foo_in3": "world",
	});
});

test("handles equal expression and duenamo expression", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			id: NOT("1"),
			name: "username",
			foo: IN("bar", "baz"),
			bar: AND(NOT("foo"), NOT("hello")),
		});

	t.is(
		expression,
		"(#id <> :not_id) and (#name = :name) and (#foo IN (:foo_in0, :foo_in1)) and ((#bar <> :not_bar_and0) AND (#bar <> :not_bar_and1))",
	);
	t.deepEqual(attributeNames, {
		"#id": "id",
		"#name": "name",
		"#foo": "foo",
		"#bar": "bar",
	});
	t.deepEqual(attributeValues, {
		":not_id": "1",
		":name": "username",
		":foo_in0": "bar",
		":foo_in1": "baz",
		":not_bar_and0": "foo",
		":not_bar_and1": "hello",
	});
});

test("handles booleans", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			disabled: false,
			name: "username",
		});

	t.is(expression, "(#disabled = :disabled) and (#name = :name)");
	t.deepEqual(attributeNames, {
		"#disabled": "disabled",
		"#name": "name",
	});
	t.deepEqual(attributeValues, {
		":disabled": false,
		":name": "username",
	});
});

test("handles duenamo expression AND with IN and NOT", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			foo: AND(IN("foo", "bar"), NOT("hello")),
		});

	t.is(
		expression,
		"((#foo IN (:foo_and0_in0, :foo_and0_in1)) AND (#foo <> :not_foo_and1))",
	);
	t.deepEqual(attributeNames, {
		"#foo": "foo",
	});
	t.deepEqual(attributeValues, {
		":foo_and0_in0": "foo",
		":foo_and0_in1": "bar",
		":not_foo_and1": "hello",
	});
});

test("handles duenamo expression AND with NOT", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			foo: AND(NOT("foo"), NOT("hello")),
		});

	t.is(expression, "((#foo <> :not_foo_and0) AND (#foo <> :not_foo_and1))");
	t.deepEqual(attributeNames, {
		"#foo": "foo",
	});
	t.deepEqual(attributeValues, {
		":not_foo_and0": "foo",
		":not_foo_and1": "hello",
	});
});

test("handles nested duenamo expression AND", (t) => {
	const { attributeNames, attributeValues, expression } =
		createConditionExpression({
			foo: AND(NOT("foo"), AND(NOT("hello"), NOT("world"))),
		});

	t.is(
		expression,
		"((#foo <> :not_foo_and0) AND ((#foo <> :not_foo_and1_and0) AND (#foo <> :not_foo_and1_and1)))",
	);
	t.deepEqual(attributeNames, {
		"#foo": "foo",
	});
	t.deepEqual(attributeValues, {
		":not_foo_and0": "foo",
		":not_foo_and1_and0": "hello",
		":not_foo_and1_and1": "world",
	});
});
