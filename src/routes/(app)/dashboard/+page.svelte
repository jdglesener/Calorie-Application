<script lang="ts">
	import { queryStore, gql } from '@urql/svelte';
	import { getContextClient } from '@urql/svelte';
	import MacroSummary from '$lib/components/calories/MacroSummary.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const client = getContextClient();

	const DASHBOARD_QUERY = gql`
		query DashboardLog($date: Date!) {
			dailyLog(date: $date) {
				id
				logDate
				calorieGoal
				totalCalories
				totalProteinG
				totalCarbsG
				totalFatG
				entries {
					id
					foodName
					calories
					mealType
				}
			}
			calorieStreak
			me {
				name
				profile {
					dailyCalorieGoal
					displayName
					proteinGoalG
					carbsGoalG
					fatGoalG
				}
			}
		}
	`;

	const dailyLogQuery = $derived(
		queryStore({ client, query: DASHBOARD_QUERY, variables: { date: data.today } })
	);

	const log = $derived($dailyLogQuery.data?.dailyLog);
	const streak = $derived($dailyLogQuery.data?.calorieStreak ?? 0);
	const me = $derived($dailyLogQuery.data?.me);
	const calorieGoal = $derived(log?.calorieGoal ?? me?.profile?.dailyCalorieGoal ?? 2000);
	const proteinGoal = $derived(me?.profile?.proteinGoalG ?? null);
	const carbsGoal = $derived(me?.profile?.carbsGoalG ?? null);
	const fatGoal = $derived(me?.profile?.fatGoalG ?? null);
</script>

<svelte:head>
	<title>Dashboard — Discipline</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">
				Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
				{me?.profile?.displayName ?? me?.name ?? 'there'}
			</h1>
			<p class="text-sm text-gray-500 mt-0.5">
				{new Date(data.today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
			</p>
		</div>
		{#if streak > 0}
			<div class="flex flex-col items-center">
				<span class="text-3xl font-bold text-brand-600">{streak}</span>
				<span class="text-xs text-gray-500">day streak</span>
			</div>
		{/if}
	</div>

	{#if $dailyLogQuery.fetching}
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

		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h2 class="font-semibold text-gray-900">Today's log</h2>
				<a href="/calories/{data.today}" class="btn-primary text-xs px-3 py-1.5">Add food</a>
			</div>
			{#if log?.entries?.length}
				<ul class="divide-y divide-gray-100">
					{#each log.entries as entry}
						<li class="px-4 py-3 sm:px-6 flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-gray-900">{entry.foodName}</p>
								<p class="text-xs text-gray-400 capitalize">{entry.mealType.toLowerCase()}</p>
							</div>
							<span class="text-sm font-semibold text-gray-700">{entry.calories} cal</span>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="card-body text-center py-10">
					<p class="text-gray-500 text-sm">Nothing logged yet today.</p>
					<a href="/calories/{data.today}" class="btn-primary mt-4 inline-flex">Log your first meal</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
