<script lang="ts">
	import { queryStore, gql, getContextClient } from '@urql/svelte';
	import DailyLog from '$lib/components/calories/DailyLog.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const client = getContextClient();

	const FRIEND_LOG_QUERY = gql`
		query FriendLog($friendId: ID!, $date: Date!) {
			friendProfile(friendId: $friendId) {
				id
				name
				displayName
				avatarUrl
			}
			friendDailyLog(friendId: $friendId, date: $date) {
				id
				logDate
				totalCalories
				totalProteinG
				totalCarbsG
				totalFatG
				entries {
					id
					foodName
					servingsConsumed
					servingSize
					servingUnit
					calories
					proteinG
					carbsG
					fatG
					mealType
					loggedAt
				}
			}
		}
	`;

	let selectedDate = $state(data.today);

	let logStore = $state(
		queryStore({
			client,
			query: FRIEND_LOG_QUERY,
			variables: { friendId: data.friendId, date: selectedDate }
		})
	);

	$effect(() => {
		logStore = queryStore({
			client,
			query: FRIEND_LOG_QUERY,
			variables: { friendId: data.friendId, date: selectedDate }
		});
	});

	const profile = $derived($logStore.data?.friendProfile);
	const log = $derived($logStore.data?.friendDailyLog);
	const displayName = $derived(profile?.displayName ?? profile?.name ?? '');
	const initial = $derived(displayName.charAt(0).toUpperCase());

	function getPrevDate(d: string) {
		const dt = new Date(d + 'T12:00:00');
		dt.setDate(dt.getDate() - 1);
		return dt.toLocaleDateString('en-CA');
	}

	function getNextDate(d: string) {
		const dt = new Date(d + 'T12:00:00');
		dt.setDate(dt.getDate() + 1);
		return dt.toLocaleDateString('en-CA');
	}

	const today = new Date().toLocaleDateString('en-CA');
	const isToday = $derived(selectedDate === today);
</script>

<svelte:head><title>{displayName || 'Friend'}'s Log — Discipline</title></svelte:head>

<div class="space-y-6">
	<!-- Back + Header -->
	<div>
		<a href="/friends" class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Friends
		</a>

		{#if $logStore.fetching && !profile}
			<div class="flex justify-center py-12">
				<div class="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
			</div>
		{:else if profile}
			<!-- Friend header -->
			<div class="flex items-center gap-3 mb-6">
				{#if profile.avatarUrl}
					<img src={profile.avatarUrl} alt={displayName} class="h-12 w-12 rounded-full object-cover" />
				{:else}
					<div class="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
						{initial}
					</div>
				{/if}
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{displayName}</h1>
					{#if profile.displayName}
						<p class="text-sm text-gray-400">@{profile.name}</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Date navigation -->
	<div class="flex items-center justify-between">
		<button
			onclick={() => (selectedDate = getPrevDate(selectedDate))}
			class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
			aria-label="Previous day"
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<div class="text-center">
			<p class="font-semibold text-gray-900">
				{isToday
					? 'Today'
					: new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
							weekday: 'long',
							month: 'long',
							day: 'numeric'
						})}
			</p>
			{#if !isToday}
				<button
					onclick={() => (selectedDate = today)}
					class="text-xs text-brand-600 hover:underline"
				>
					Jump to today
				</button>
			{/if}
		</div>

		<button
			onclick={() => (selectedDate = getNextDate(selectedDate))}
			disabled={isToday}
			class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-default"
			aria-label="Next day"
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<!-- Totals card -->
	{#if log}
		<div class="card card-body">
			<div class="grid grid-cols-4 gap-4 text-center">
				<div>
					<p class="text-xl font-bold text-gray-900">{log.totalCalories}</p>
					<p class="text-xs text-gray-400">Calories</p>
				</div>
				<div>
					<p class="text-xl font-bold text-gray-900">{Math.round(log.totalProteinG)}g</p>
					<p class="text-xs text-gray-400">Protein</p>
				</div>
				<div>
					<p class="text-xl font-bold text-gray-900">{Math.round(log.totalCarbsG)}g</p>
					<p class="text-xs text-gray-400">Carbs</p>
				</div>
				<div>
					<p class="text-xl font-bold text-gray-900">{Math.round(log.totalFatG)}g</p>
					<p class="text-xs text-gray-400">Fat</p>
				</div>
			</div>
		</div>

		<!-- Entries -->
		<DailyLog entries={log.entries} date={selectedDate} readonly={true} />
	{:else if !$logStore.fetching}
		<div class="card card-body text-center py-10">
			<p class="text-gray-400 text-sm">No food logged on this day.</p>
		</div>
	{/if}
</div>
