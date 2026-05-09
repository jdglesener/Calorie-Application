<script lang="ts">
	import { queryStore, gql, getContextClient } from '@urql/svelte';
	import ChallengeCard from '$lib/components/challenges/ChallengeCard.svelte';

	const client = getContextClient();

	const MY_CHALLENGES_QUERY = gql`
		query MyChallenges {
			myChallenges {
				id
				name
				description
				challengeType
				targetValue
				startDate
				endDate
				isPublic
				status
				creator {
					id
					name
					displayName
				}
				participants {
					user {
						id
					}
					status
				}
			}
			me {
				id
			}
		}
	`;

	const challengesStore = $derived(queryStore({ client, query: MY_CHALLENGES_QUERY }));

	const allChallenges = $derived($challengesStore.data?.myChallenges ?? []);
	const me = $derived($challengesStore.data?.me);

	let activeTab = $state<'active' | 'invited' | 'completed'>('active');

	const activeChallenges = $derived(
		allChallenges.filter(
			(c: { status: string }) => c.status === 'ACTIVE' || c.status === 'DRAFT'
		)
	);

	const invitedChallenges = $derived(
		allChallenges.filter((c: { participants: Array<{ user: { id: string }; status: string }> }) => {
			if (!me) return false;
			const p = c.participants.find((p) => p.user.id === me.id);
			return p?.status === 'INVITED';
		})
	);

	const completedChallenges = $derived(
		allChallenges.filter(
			(c: { status: string }) => c.status === 'COMPLETED' || c.status === 'CANCELLED'
		)
	);

	const tabList = $derived([
		{ id: 'active' as const, label: 'Active', count: null },
		{ id: 'invited' as const, label: 'Invited', count: invitedChallenges.length || null },
		{ id: 'completed' as const, label: 'Completed', count: null }
	]);

	const currentList = $derived(
		activeTab === 'active'
			? activeChallenges
			: activeTab === 'invited'
				? invitedChallenges
				: completedChallenges
	);
</script>

<svelte:head><title>Challenges — Discipline</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Challenges</h1>
		<a href="/challenges/new" class="btn-primary text-sm">New Challenge</a>
	</div>

	<!-- Tabs -->
	<div class="border-b border-gray-200 flex gap-6">
		{#each tabList as tab}
			<button
				onclick={() => (activeTab = tab.id)}
				class="pb-3 text-sm font-medium transition-colors flex items-center gap-1.5
					{activeTab === tab.id
						? 'border-b-2 border-brand-600 text-brand-600'
						: 'text-gray-500 hover:text-gray-700'}"
			>
				{tab.label}
				{#if tab.count}
					<span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-xs">
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if $challengesStore.fetching}
		<div class="flex justify-center py-12">
			<div class="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
		</div>
	{:else if currentList.length === 0}
		<div class="card card-body text-center py-10">
			{#if activeTab === 'active'}
				<p class="text-gray-400 text-sm">No active challenges.</p>
				<a href="/challenges/new" class="btn-primary text-sm mt-4 inline-block">Create one</a>
			{:else if activeTab === 'invited'}
				<p class="text-gray-400 text-sm">No pending invitations.</p>
			{:else}
				<p class="text-gray-400 text-sm">No completed challenges yet.</p>
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each currentList as challenge}
				<ChallengeCard {challenge} currentUserId={me?.id ?? ''} />
			{/each}
		</div>
	{/if}
</div>
