# dÜnamodb 📀

Simple DynamoDB client written in TypeScript

## Setup

Install the package

```bash
yarn add duenamodb
```

```bash
npm install duenamodb
```

If not running in AWS Lambda configure the Client using the static accessor on the DDBClient class.

```ts
DDBClient.params = {
  region: "localhost",
  endpoint: `http://localhost:8000`,
};
```

Also you might need to provide mock AWS credentials inside the environment variables.

## Create Functions

To interact with your DynamoDB use the create-functions from the dÜnamodb lib

Put item:

```ts
const putItem = createPutItem<Attributes>(tableName);
```

Get item:

```ts
const getItem = createGetItem<Attributes, string>(tableName, "id");
```

Update item:

```ts
const updateItem = createUpdateItem<Attributes>(tableName);
```

Scan items:

```ts
const scanItems = createScanItems<Attributes>(tableName);
```

Query items:

```ts
const queryItems = createQueryItems<Attributes, number>(tableName, {
  name: indexName,
  partitionKeyName: "name",
});
```

Delete item:

```ts
const deleteItem = createDeleteItem<Attributes, string>(tablename, "id");
```

## Use Functions

Use the functions to read and write data from the DB

Put item:

```ts
await saveItem({ id: "1", name: "foo", ... });
```

Get item:

```ts
const getResult = await getItem("1"); 
```

Update item:

```ts
const updateResult = await updateItem(
  { ...item, name: "bar" },
  { updateKeys: ["name"] }
);
```

Scan items:

```ts
const scanResult = await scanItems();
```

Query items:

```ts
const queryResult = await queryItems("foo");
```

Delete item:

```ts
const success = await deleteItem("1");
```
