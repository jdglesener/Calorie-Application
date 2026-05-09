<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import UserCard from '$lib/components/social/UserCard.svelte';
	import FriendSearch from '$lib/components/social/FriendSearch.svelte';

	const client = getContextClient();

	const FRIENDS_QUERY = gql`
		query GetFriends {
			friends {
				id
				friend {
					id
					name
					displayName
					avatarUrl
				}
				status
				createdAt
			}
			pendingFriendRequests {
				id
				friend {
					id
					name
					displayName
					avatarUrl
				}
				status
				createdAt
			}
		}
	`;

	const RESPOND_MUTATION = gql`
		mutation RespondToFriendRequest($connectionId: ID!, $accept: Boolean!) {
			respondToFriendRequest(connectionId: $connectionId, accept: $accept) {
				id
				status
			}
		}
	`;

	const REMOVE_MUTATION = gql`
		mutation RemoveFriend($userId: ID!) {
			removeFriend(userId: $userId)
		}
	`;

	let friendsStore = $state(queryStore({ client, query: FRIENDS_QUERY }));
	let showSearch = $state(false);
	let loadingId = $state<string | null>(null);

	function refresh() {
		friendsStore = queryStore({ client, query: FRIENDS_QUERY, requestPolicy: 'network-only' });
	}

	const friends = $derived($friendsStore.data?.friends ?? []);
	const pending = $derived($friendsStore.data?.pendingFriendRequests ?? []);
	const existingFriendIds = $derived(friends.map((f: { friend: { id: string } }) => f.friend.id));
	const pendingIds = $derived(pending.map((p: { friend: { id: string } }) => p.friend.id));

	async function respond(connectionId: string, accept: boolean) {
		loadingId = connectionId;
		await mutationStore({
			client,
			query: RESPOND_MUTATION,
			variables: { connectionId, accept }
		}).toPromise?.();
		loadingId = null;
		refresh();
	}

	async function removeFriend(userId: string) {
		loadingId = userId;
		await mutationStore({
			client,
			query: REMOVE_MUTATION,
			variables: { userId }
		}).toPromise?.();
		loadingId = null;
		refresh();
	}
</script>

<svelte:head><title>Friends — Discipline</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Friends</h1>
		<button onclick={() => (showSearch = !showSearch)} class="btn-secondary text-sm">
			{showSearch ? 'Cancel' : 'Find Friends'}
		</button>
	</div>

	<!-- Search -->
	{#if showSearch}
		<div class="card card-body">
			<h2 class="text-sm font-semibold text-gray-700 mb-3">Find People</h2>
			<FriendSearch
				{existingFriendIds}
				{pendingIds}
				onRequestSent={() => {
					refresh();
				}}
			/>
		</div>
	{/if}

	{#if $friendsStore.fetching && friends.length === 0 && pending.length === 0}
		<div class="flex justify-center py-12">
			<div class="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
		</div>
	{:else}
		<!-- Pending Requests -->
		{#if pending.length > 0}
			<div class="card">
				<div class="card-header">
					<h2 class="font-semibold text-gray-900">
						Pending Requests
						<span class="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold">
							{pending.length}
						</span>
					</h2>
				</div>
				<ul class="divide-y divide-gray-100">
					{#each pending as conn}
						<li>
							<UserCard
								user={conn.friend}
								variant="pending"
								onAccept={() => respond(conn.id, true)}
								onDecline={() => respond(conn.id, false)}
								loading={loadingId === conn.id}
							/>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Friend List -->
		<div class="card">
			<div class="card-header">
				<h2 class="font-semibold text-gray-900">My Friends</h2>
			</div>
			{#if friends.length === 0}
				<div class="card-body text-center py-10">
					<p class="text-gray-400 text-sm">You haven't added any friends yet.</p>
					<button onclick={() => (showSearch = true)} class="btn-primary text-sm mt-4">
						Find Friends
					</button>
				</div>
			{:else}
				<ul class="divide-y divide-gray-100">
					{#each friends as conn}
						<li>
							<UserCard
								user={conn.friend}
								variant="friend"
								onRemove={() => removeFriend(conn.friend.id)}
								loading={loadingId === conn.friend.id}
							/>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>
