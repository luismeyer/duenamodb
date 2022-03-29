import child from "child_process";
import { table } from "console";
import { launch } from "dynamodb-local";
import find from "find-process";
import util from "util";

import { test } from "../package.json";
import { DDBClient } from "../src";

const exec = util.promisify(child.exec);
const { dbPort, tablename, indexname } = test;

console.log("Configuring DB client...");
DDBClient.params = {
  region: "localhost",
  endpoint: `http://localhost:${dbPort}`,
};

find("port", dbPort)
  .then(async (ps) => {
    const dynamoProcess = ps.find((p) =>
      p.cmd.toLowerCase().includes("dynamodblocal")
    );

    if (dynamoProcess) {
      const tableExists = await DDBClient.dynamoDB
        .listTables()
        .promise()
        .then((tables) => tables.TableNames?.some((n) => n === tablename));

      if (tableExists) {
        return;
      }

      console.log("Killing existing dynamodb process...");
      await exec(`kill -9 ${dynamoProcess.pid}`);
    }

    console.log("Starting DynamoDB Local...");
    return launch(dbPort, null, [], false, true).then(() => {
      console.log("Creating Test Table...");

      return DDBClient.dynamoDB
        .createTable({
          TableName: tablename,
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "age", AttributeType: "N" },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: indexname,
              KeySchema: [{ AttributeName: "age", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
            },
          ],
        })
        .promise();
    });
  })
  .then(() => {
    console.log("Setup finished");
    process.exit();
  });
