<script lang="ts">
	import '../app.css';
	import { setContextClient } from '@urql/svelte';
	import { createUrqlClient } from '$lib/graphql/client';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	setContextClient(createUrqlClient());
</script>

{@render children()}
