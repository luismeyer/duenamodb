import {
	DynamoDBClient,
	type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

export class DDBClient {
	private static _client: DynamoDBClient;
	private static _params: DynamoDBClientConfig = {};

	private constructor() {}

	public static get params(): DynamoDBClientConfig {
		if (!DDBClient._params.region) {
			DDBClient._params.region = process.env.AWS_REGION;
		}

		const isVercel = process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN;
		if (
			!DDBClient._params.credentials &&
			isVercel &&
			process.env.AWS_ROLE_ARN
		) {
			DDBClient._params.credentials = awsCredentialsProvider({
				roleArn: process.env.AWS_ROLE_ARN,
			});
		}

		if (
			!DDBClient._params.credentials &&
			process.env.AWS_ACCESS_KEY_ID &&
			process.env.AWS_SECRET_ACCESS_KEY
		) {
			DDBClient._params.credentials = {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			};
		}

		return DDBClient._params;
	}
	public static set params(value: DynamoDBClientConfig) {
		DDBClient._params = value;
	}

	private static init() {
		if (!DDBClient._client) {
			DDBClient._client = new DynamoDBClient(DDBClient.params);
		}

		return DDBClient._client;
	}

	public static get instance() {
		if (!DDBClient._client) {
			DDBClient.init();
		}

		return DDBClient._client;
	}
}
