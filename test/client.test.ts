import test from "ava";

import { DDBClient } from "../src";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

test("Client is always the same instance", (t) => {
	const firstInstance = DDBClient.instance;
	const secondInstance = DDBClient.instance;

	t.is(firstInstance, secondInstance);
});

test("Client uses vercel credentials", (t) => {
	process.env.VERCEL_OIDC_TOKEN = "true";
	process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/test";
	const instance = DDBClient.instance;

	t.deepEqual(
		instance.config.credentials,
		awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN }),
	);
});
