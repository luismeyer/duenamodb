import { DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export class DDBClient {
  private static _client: DocumentClient;

  private constructor() {}

  public static params: DocumentClient.DocumentClientOptions &
    DynamoDB.Types.ClientConfiguration;

  public static get instance() {
    if (!this._client) {
      this._client = new DocumentClient(this.params);
    }

    return this._client;
  }
}
