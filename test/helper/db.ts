import {
	CreateTableCommand,
	DeleteTableCommand,
	type CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";

import { DDBClient } from "../../src";
import { randomNumber, randomTableName } from "./random";

export type Attributes = {
	id: string;
	age: number;
	name: string;
};

export const DB_PORT = 8000;

export const createAttributes = (options?: {
	id?: string;
	age?: number;
	name?: string;
}): Attributes => {
	const id = options?.id ?? randomNumber();
	const age = options?.age ?? randomNumber(100);

	return {
		id: String(id),
		age,
		name: options?.name ?? `Name-${id}`,
	};
};

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
