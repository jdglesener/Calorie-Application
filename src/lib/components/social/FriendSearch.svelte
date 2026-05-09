<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import UserCard from './UserCard.svelte';

	let {
		existingFriendIds,
		pendingIds,
		onRequestSent
	}: {
		existingFriendIds: string[];
		pendingIds: string[];
		onRequestSent?: () => void;
	} = $props();

	const client = getContextClient();

	const SEARCH_QUERY = gql`
		query SearchUsers($query: String!, $limit: Int) {
			searchUsers(query: $query, limit: $limit) {
				id
				name
				displayName
				avatarUrl
			}
		}
	`;

	const SEND_REQUEST_MUTATION = gql`
		mutation SendFriendRequest($userId: ID!) {
			sendFriendRequest(userId: $userId) {
				id
				status
			}
		}
	`;

	let searchQuery = $state('');
	let sentIds = $state(new Set<string>());
	let loadingId = $state<string | null>(null);

	const shouldSearch = $derived(searchQuery.trim().length >= 2);

	let searchStore = $state(
		queryStore({ client, query: SEARCH_QUERY, variables: { query: '', limit: 10 }, pause: true })
	);

	$effect(() => {
		if (shouldSearch) {
			searchStore = queryStore({
				client,
				query: SEARCH_QUERY,
				variables: { query: searchQuery.trim(), limit: 10 }
			});
		}
	});

	const results = $derived(
		shouldSearch
			? ($searchStore.data?.searchUsers ?? []).filter(
					(u: { id: string }) =>
						!existingFriendIds.includes(u.id) && !pendingIds.includes(u.id)
				)
			: []
	);

	async function sendRequest(userId: string) {
		loadingId = userId;
		await mutationStore({
			client,
			query: SEND_REQUEST_MUTATION,
			variables: { userId }
		}).toPromise?.();
		sentIds = new Set([...sentIds, userId]);
		loadingId = null;
		onRequestSent?.();
	}
</script>

<div class="space-y-2">
	<input
		type="search"
		placeholder="Search by name…"
		bind:value={searchQuery}
		class="input"
	/>

	{#if shouldSearch}
		{#if $searchStore.fetching}
			<p class="text-sm text-gray-400 px-1">Searching…</p>
		{:else if results.length === 0}
			<p class="text-sm text-gray-400 px-1">No users found.</p>
		{:else}
			<div class="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
				{#each results as user}
					<UserCard
						{user}
						variant={sentIds.has(user.id) ? 'search-result' : 'search-result'}
						onAdd={sentIds.has(user.id) ? undefined : () => sendRequest(user.id)}
						loading={loadingId === user.id}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>
