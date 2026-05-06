import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: './src/lib/server/graphql/schema/index.ts',
	documents: ['src/**/*.svelte', 'src/**/*.ts', '!src/lib/server/**'],
	generates: {
		'./src/lib/graphql/generated/graphql.ts': {
			plugins: ['typescript', 'typescript-operations', 'typed-document-node']
		}
	}
};

export default config;
