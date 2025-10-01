import test from "ava";

import { DDBClient } from "../src";

test("Client is always the same instance", (t) => {
	const firstInstance = DDBClient.instance;
	const secondInstance = DDBClient.instance;

	t.is(firstInstance, secondInstance);
});
