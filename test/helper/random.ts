export const randomTableName = () => `table-${randomString()}`;

export const randomString = (len = 10) =>
	Math.random()
		.toString(36)
		.substring(2, 2 + len);
