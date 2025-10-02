import {
	CreateTableCommand,
	DeleteTableCommand,
	type CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";

import { DDBClient } from "../../src";
import { randomTableName } from "./random";

export const DB_PORT = 8000;

export const createTable = async (
	input: Omit<CreateTableCommandInput, "TableName">,
	tablename = randomTableName(),
) => {
	DDBClient.params = {
		region: "localhost",
		endpoint: `http://localhost:${DB_PORT}`,
		credentials: {
			accessKeyId: "test",
			secretAccessKey: "test",
		},
	};

	try {
		await DDBClient.instance.send(
			new CreateTableCommand({
				TableName: tablename,
				...input,
			}),
		);

		return {
			tablename,
			destroy: () =>
				DDBClient.instance.send(
					new DeleteTableCommand({ TableName: tablename }),
				),
		};
	} catch (error) {
		console.error("Create table error", error);
		throw error;
	}
};
