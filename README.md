# dÜnamodb 📀

Simple, strongly-typed helpers around the AWS SDK DynamoDB client.

## Install 🛠

```bash
pnpm install duenamodb
```

```bash
npm install duenamodb
```

## Configure the shared DynamoDB client

All high-level helpers use the singleton `DDBClient` under the hood. Configure it once before creating any functions (for local development you must also supply credentials):

```ts
import { DDBClient } from "duenamodb";

DDBClient.params = {
	region: "localhost",
	endpoint: "http://localhost:8000",
	credentials: {
		accessKeyId: "local",
		secretAccessKey: "local",
	},
};
```

From that point `DDBClient.instance` returns the lazily created `DynamoDBClient` from `@aws-sdk/client-dynamodb`.

## Create typed table helpers

Every DynamoDB action has a corresponding `create*` builder that wires the table metadata once and returns a ready-to-use function. Builders accept a single options object so the README matches the current implementation.

### `createPutItem`

```ts
import { createPutItem } from "duenamodb";

type User = { id: string; name: string };

const putUser = createPutItem<User>({ tablename: "Users" });

await putUser({ id: "1", name: "Ada" });
```

Returned function signature: `(item, options?) => Promise<Attributes>`. Pass native `PutItemCommand` overrides through `options` if you need condition expressions, return values, etc.

### `createGetItem`

```ts
import { createGetItem } from "duenamodb";

const getUser = createGetItem<User, "id">({
	tablename: "Users",
	pkName: "id",
});

const user = await getUser({ pk: "1" });
```

If your table uses a sort key, provide `sortKeyName` (inferred generic `TSK` tracks its type) and call with `{ pk, sk }`. Extra `GetItemCommand` options go in `dynamodbOptions`.

### `createUpdateItem`

```ts
import { createUpdateItem } from "duenamodb";

const updateUser = createUpdateItem<User>({
	tablename: "Users",
	pkName: "id",
});

await updateUser(
	{ id: "1", name: "Grace" },
	{ updateKeys: ["name"] },
);
```

`updateKeys` decides which attributes are written. Use `removeKeys` to build a `REMOVE` clause. The function returns the updated object or `undefined` if the update fails.

### `createDeleteItem`

```ts
import { createDeleteItem } from "duenamodb";

const deleteUser = createDeleteItem<User, "id">({
	tablename: "Users",
	pkName: "id",
});

const deleted = await deleteUser({ pk: "1" });
```

Returns `true` when DynamoDB reports success. Provide `sortKeyName` if the table requires it.

### `createScanItems`

```ts
import { createScanItems, NOT } from "duenamodb";

const scanUsers = createScanItems<User>({ tablename: "Users" });

const inactiveUsers = await scanUsers({
	filter: { status: NOT("active") },
});
```

Supports optional `filter` conditions and `ScanCommand` overrides through `dynamodbOptions`. Pagination is handled automatically until `LastEvaluatedKey` is empty.

### `createQueryItems`

```ts
import { createQueryItems, IS_GREATER_THAN } from "duenamodb";

const queryUserEvents = createQueryItems<UserEvent, "userId", "createdAt">({
	tablename: "UserEvents",
	pkName: "userId",
	skName: "createdAt",
});

const events = await queryUserEvents({
	pk: "user-1",
	sk: IS_GREATER_THAN(0),
});
```

Add `indexName` when querying a GSI. You can also supply a `filter` expression or pass raw `QueryCommand` options through `dynamodbOptions`. Pagination is automatic just like `scan`.

## Table utility

`createTableFunctions` bundles the builders above into a single object:

```ts
import { createTableFunctions } from "duenamodb";

const userTable = createTableFunctions<User, "id">({
	tablename: "Users",
	partitionKeyName: "id",
});

const { getItem, putItem, deleteItem, scanItems, updateItem, queryItems } =
	userTable;
```

Pass `sortKeyName` to add sort-key support. Each helper behaves exactly like the individually created versions.

## Expression utilities

Need richer key or filter expressions? The `expression` module exposes builders that map 1:1 to DynamoDB syntax while preserving type safety:

```ts
import {
	IN,
	NOT,
	AND,
	IS_GREATER_THAN,
	IS_LESS_THAN,
	IS_BETWEEN,
	BEGINS_WITH,
} from "duenamodb";

const filter = {
	status: NOT("deleted"),
	type: IN("A", "B"),
	createdAt: IS_BETWEEN(0, 1000),
};
```

These helpers power `filter` and sort-key conditions in `createQueryItems` and `createScanItems`, but you can also use the lower-level exports (`createConditionExpression`, `expressionAttributeNames`, etc.) if you need direct access to the generated structures.

## Direct command helpers

Every module also exports the underlying functions (`putItem`, `getItem`, `updateItem`, `deleteItem`, `scanItems`, `queryItems`) in case you prefer to pass already-marshalled input yourself. They expect DynamoDB-native shapes and mirror the AWS SDK response handling.

