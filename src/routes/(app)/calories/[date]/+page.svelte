<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import DailyLog from '$lib/components/calories/DailyLog.svelte';
	import FoodSearch from '$lib/components/calories/FoodSearch.svelte';
	import MacroSummary from '$lib/components/calories/MacroSummary.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const client = getContextClient();

	const DAILY_LOG_QUERY = gql`
		query GetDailyLog($date: Date!) {
			dailyLog(date: $date) {
				id
				logDate
				calorieGoal
				notes
				totalCalories
				totalProteinG
				totalCarbsG
				totalFatG
				entries {
					id
					foodName
					brand: foodName
					servingSize
					servingUnit
					servingsConsumed
					calories
					proteinG
					carbsG
					fatG
					mealType
					loggedAt
				}
			}
			me {
				profile {
					dailyCalorieGoal
					proteinGoalG
					carbsGoalG
					fatGoalG
				}
			}
		}
	`;

	let logStore = $derived(
		queryStore({ client, query: DAILY_LOG_QUERY, variables: { date: data.date } })
	);

	const log = $derived($logStore.data?.dailyLog);
	const calorieGoal = $derived(log?.calorieGoal ?? $logStore.data?.me?.profile?.dailyCalorieGoal ?? 2000);
	const proteinGoal = $derived($logStore.data?.me?.profile?.proteinGoalG ?? null);
	const carbsGoal = $derived($logStore.data?.me?.profile?.carbsGoalG ?? null);
	const fatGoal = $derived($logStore.data?.me?.profile?.fatGoalG ?? null);

	let showSearch = $state(false);

	const today = new Date().toLocaleDateString('en-CA');
	const prevDate = getPrevDate(data.date);
	const nextDate = getNextDate(data.date);

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

	function handleEntryAdded() {
		logStore = queryStore({
			client,
			query: DAILY_LOG_QUERY,
			variables: { date: data.date },
			requestPolicy: 'network-only'
		});
		showSearch = false;
	}

	function handleEntryDeleted() {
		logStore = queryStore({
			client,
			query: DAILY_LOG_QUERY,
			variables: { date: data.date },
			requestPolicy: 'network-only'
		});
	}

	function handleEntryEdited() {
		logStore = queryStore({
			client,
			query: DAILY_LOG_QUERY,
			variables: { date: data.date },
			requestPolicy: 'network-only'
		});
	}
</script>

<svelte:head>
	<title>
		{new Date(data.date + 'T12:00:00').toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		})} — Calories
	</title>
</svelte:head>

<div class="space-y-5">
	<!-- Date navigation -->
	<div class="flex items-center justify-between">
		<a href="/calories/{prevDate}" class="btn-secondary px-3 py-1.5 text-xs">&#8592; Prev</a>
		<div class="text-center">
			<h1 class="text-lg font-semibold text-gray-900">
				{new Date(data.date + 'T12:00:00').toLocaleDateString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric'
				})}
			</h1>
			{#if data.date !== today}
				<a href="/calories/{today}" class="text-xs text-brand-600 hover:underline">Back to today</a>
			{/if}
		</div>
		<a
			href="/calories/{nextDate}"
			class="btn-secondary px-3 py-1.5 text-xs {nextDate > today ? 'opacity-40 pointer-events-none' : ''}"
		>
			Next &#8594;
		</a>
	</div>

	{#if $logStore.fetching}
		<div class="card card-body flex items-center justify-center h-40">
			<div class="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
		</div>
	{:else}
		<MacroSummary
			calories={log?.totalCalories ?? 0}
			{calorieGoal}
			protein={log?.totalProteinG ?? 0}
			carbs={log?.totalCarbsG ?? 0}
			fat={log?.totalFatG ?? 0}
			{proteinGoal}
			{carbsGoal}
			{fatGoal}
		/>

		{#if showSearch}
			<FoodSearch date={data.date} onAdded={handleEntryAdded} onCancel={() => (showSearch = false)} />
		{:else}
			<button onclick={() => (showSearch = true)} class="btn-primary w-full">
				+ Add Food
			</button>
		{/if}

		<DailyLog entries={log?.entries ?? []} date={data.date} onDeleted={handleEntryDeleted} onEdited={handleEntryEdited} />
	{/if}
</div>
