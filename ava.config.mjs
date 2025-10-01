export default async () => {
	return {
		extensions: ["ts"],
		files: ["test/**/*", "!test/helper/**/*"],
		require: ["ts-node/register"],
		timeout: "1m",
	};
};
