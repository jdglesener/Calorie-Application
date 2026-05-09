<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import { goto } from '$app/navigation';
	import Leaderboard from '$lib/components/challenges/Leaderboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const client = getContextClient();

	const CHALLENGE_QUERY = gql`
		query GetChallenge($id: ID!) {
			challenge(id: $id) {
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
					avatarUrl
				}
				participants {
					user {
						id
						name
						displayName
						avatarUrl
					}
					status
					joinedAt
				}
				leaderboard {
					rank
					user {
						id
						name
						displayName
						avatarUrl
					}
					totalMetricValue
					daysParticipated
				}
			}
		}
	`;

	const RESPOND_MUTATION = gql`
		mutation RespondToChallenge($challengeId: ID!, $accept: Boolean!) {
			respondToChallenge(challengeId: $challengeId, accept: $accept) {
				status
			}
		}
	`;

	const CANCEL_MUTATION = gql`
		mutation CancelChallenge($id: ID!) {
			cancelChallenge(id: $id) {
				id
				status
			}
		}
	`;

	let challengeStore = $state(
		queryStore({ client, query: CHALLENGE_QUERY, variables: { id: data.id } })
	);

	function refresh() {
		challengeStore = queryStore({
			client,
			query: CHALLENGE_QUERY,
			variables: { id: data.id },
			requestPolicy: 'network-only'
		});
	}

	const challenge = $derived($challengeStore.data?.challenge);
	const isCreator = $derived(challenge?.creator.id === data.userId);
	const myParticipant = $derived(
		challenge?.participants.find(
			(p: { user: { id: string }; status: string }) => p.user.id === data.userId
		)
	);
	const isAccepted = $derived(myParticipant?.status === 'ACCEPTED');
	const isInvited = $derived(myParticipant?.status === 'INVITED');
	const canSeeLeaderboard = $derived(isAccepted || isCreator);

	let responding = $state(false);
	let cancelling = $state(false);
	let confirmCancel = $state(false);

	const typeLabels: Record<string, string> = {
		CALORIE_LIMIT: 'Calorie Limit',
		CALORIE_GOAL: 'Calorie Goal',
		STEP_GOAL: 'Step Goal',
		EXERCISE_MINUTES: 'Exercise Minutes',
		CUSTOM: 'Custom'
	};

	const statusColors: Record<string, string> = {
		ACTIVE: 'bg-green-100 text-green-700',
		DRAFT: 'bg-gray-100 text-gray-500',
		COMPLETED: 'bg-blue-100 text-blue-700',
		CANCELLED: 'bg-red-100 text-red-500'
	};

	async function respond(accept: boolean) {
		responding = true;
		await mutationStore({
			client,
			query: RESPOND_MUTATION,
			variables: { challengeId: data.id, accept }
		}).toPromise?.();
		responding = false;
		refresh();
	}

	async function cancelChallenge() {
		cancelling = true;
		await mutationStore({
			client,
			query: CANCEL_MUTATION,
			variables: { id: data.id }
		}).toPromise?.();
		cancelling = false;
		await goto('/challenges');
	}

	function getParticipantStatusColor(status: string) {
		if (status === 'ACCEPTED') return 'bg-green-100 text-green-700';
		if (status === 'DECLINED') return 'bg-gray-100 text-gray-500';
		return 'bg-amber-100 text-amber-700';
	}
</script>

<svelte:head><title>{challenge?.name ?? 'Challenge'} — Discipline</title></svelte:head>

<div class="space-y-6">
	<!-- Back -->
	<a href="/challenges" class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Challenges
	</a>

	{#if $challengeStore.fetching && !challenge}
		<div class="flex justify-center py-12">
			<div class="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
		</div>
	{:else if !challenge}
		<div class="card card-body text-center py-10">
			<p class="text-gray-400 text-sm">Challenge not found or you don't have access.</p>
			<a href="/challenges" class="btn-secondary text-sm mt-4 inline-block">Back to Challenges</a>
		</div>
	{:else}
		<!-- Challenge header -->
		<div class="card card-body space-y-3">
			<div class="flex items-start justify-between gap-3">
				<h1 class="text-2xl font-bold text-gray-900">{challenge.name}</h1>
				<span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-1 {statusColors[challenge.status] ?? 'bg-gray-100 text-gray-500'}">
					{challenge.status.charAt(0) + challenge.status.slice(1).toLowerCase()}
				</span>
			</div>

			{#if challenge.description}
				<p class="text-sm text-gray-600">{challenge.description}</p>
			{/if}

			<div class="grid grid-cols-2 gap-3 text-sm">
				<div>
					<p class="text-xs text-gray-400">Type</p>
					<p class="font-medium text-gray-900">{typeLabels[challenge.challengeType] ?? challenge.challengeType}</p>
				</div>
				<div>
					<p class="text-xs text-gray-400">Target</p>
					<p class="font-medium text-gray-900">{challenge.targetValue}</p>
				</div>
				<div>
					<p class="text-xs text-gray-400">Dates</p>
					<p class="font-medium text-gray-900">
						{new Date(challenge.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
						–
						{new Date(challenge.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
					</p>
				</div>
				<div>
					<p class="text-xs text-gray-400">Created by</p>
					<p class="font-medium text-gray-900">{challenge.creator.displayName ?? challenge.creator.name}</p>
				</div>
			</div>
		</div>

		<!-- Action bar -->
		{#if isInvited}
			<div class="card card-body">
				<p class="text-sm text-gray-600 mb-3">You've been invited to this challenge.</p>
				<div class="flex gap-3">
					<button
						onclick={() => respond(true)}
						disabled={responding}
						class="btn-primary flex-1"
					>
						{responding ? 'Joining…' : 'Accept'}
					</button>
					<button
						onclick={() => respond(false)}
						disabled={responding}
						class="btn-secondary flex-1"
					>
						Decline
					</button>
				</div>
			</div>
		{:else if isCreator && (challenge.status === 'ACTIVE' || challenge.status === 'DRAFT')}
			<div class="card card-body">
				{#if confirmCancel}
					<p class="text-sm text-gray-600 mb-3">Are you sure you want to cancel this challenge?</p>
					<div class="flex gap-3">
						<button onclick={cancelChallenge} disabled={cancelling} class="btn-danger flex-1">
							{cancelling ? 'Cancelling…' : 'Yes, Cancel Challenge'}
						</button>
						<button onclick={() => (confirmCancel = false)} class="btn-secondary flex-1">
							Never Mind
						</button>
					</div>
				{:else}
					<button onclick={() => (confirmCancel = true)} class="btn-danger w-full">
						Cancel Challenge
					</button>
				{/if}
			</div>
		{/if}

		<!-- Leaderboard -->
		{#if canSeeLeaderboard}
			<Leaderboard
				leaderboard={challenge.leaderboard}
				challengeType={challenge.challengeType}
				currentUserId={data.userId}
			/>
		{:else if isInvited}
			<div class="card card-body text-center py-6">
				<p class="text-gray-400 text-sm">Accept the challenge to see the leaderboard.</p>
			</div>
		{/if}

		<!-- Participants -->
		<div class="card">
			<div class="card-header">
				<h2 class="font-semibold text-gray-900">Participants</h2>
			</div>
			<ul class="divide-y divide-gray-100">
				{#each challenge.participants as participant}
					{@const displayName = participant.user.displayName ?? participant.user.name}
					{@const initial = displayName.charAt(0).toUpperCase()}
					<li class="flex items-center gap-3 px-4 sm:px-5 py-3">
						{#if participant.user.avatarUrl}
							<img src={participant.user.avatarUrl} alt={displayName} class="h-8 w-8 rounded-full object-cover" />
						{:else}
							<div class="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
								{initial}
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{displayName}{participant.user.id === data.userId ? ' (you)' : ''}
							</p>
						</div>
						<span class="text-xs px-2 py-0.5 rounded-full font-medium {getParticipantStatusColor(participant.status)}">
							{participant.status.charAt(0) + participant.status.slice(1).toLowerCase()}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
