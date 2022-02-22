import { DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export class DDBClient {
  private static _client: DocumentClient;
  private static _dynamo: DynamoDB;

  private constructor() {}

  public static params: DocumentClient.DocumentClientOptions &
    DynamoDB.Types.ClientConfiguration;

  private static init() {
    this._dynamo = new DynamoDB(this.params);
    this._client = new DocumentClient(this.params);
  }

  public static get instance() {
    if (!this._client) {
      this.init();
    }

    return this._client;
  }

  public static get dynamoDB() {
    if (!this._client) {
      this.init();
    }

    return this._dynamo;
  }
}
