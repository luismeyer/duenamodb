import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

export class DDBClient {
  private static _client: DynamoDBClient;

  private constructor() {}

  public static params: DynamoDBClientConfig;

  private static init() {
    this._client = new DynamoDBClient(this.params);
  }

  public static get instance() {
    if (!this._client) {
      this.init();
    }

    return this._client;
  }
}
