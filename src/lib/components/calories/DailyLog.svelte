<script lang="ts">
	import { mutationStore, gql, getContextClient } from '@urql/svelte';

	type Entry = {
		id: string;
		foodName: string;
		servingsConsumed: number;
		servingSize: number;
		servingUnit: string;
		calories: number;
		proteinG?: number;
		carbsG?: number;
		fatG?: number;
		mealType: string;
		loggedAt: string;
	};

	let {
		entries,
		date,
		onDeleted
	}: {
		entries: Entry[];
		date: string;
		onDeleted: () => void;
	} = $props();

	const client = getContextClient();

	const DELETE_MUTATION = gql`
		mutation DeleteFoodEntry($id: ID!) {
			deleteFoodEntry(id: $id)
		}
	`;

	const mealOrder = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER'];

	const grouped = $derived(
		mealOrder.reduce(
			(acc, meal) => {
				const items = entries.filter((e) => e.mealType === meal);
				if (items.length) acc[meal] = items;
				return acc;
			},
			{} as Record<string, Entry[]>
		)
	);

	const mealLabel: Record<string, string> = {
		BREAKFAST: 'Breakfast',
		LUNCH: 'Lunch',
		DINNER: 'Dinner',
		SNACK: 'Snack',
		OTHER: 'Other'
	};

	async function deleteEntry(id: string) {
		await mutationStore({
			client,
			query: DELETE_MUTATION,
			variables: { id }
		}).toPromise?.();
		onDeleted();
	}
</script>

{#if entries.length === 0}
	<div class="card card-body text-center py-10">
		<p class="text-gray-400 text-sm">No food logged yet. Add your first item above.</p>
	</div>
{:else}
	<div class="space-y-4">
		{#each Object.entries(grouped) as [meal, items]}
			<div class="card">
				<div class="card-header py-3 px-4 sm:px-5">
					<h3 class="text-sm font-semibold text-gray-700">{mealLabel[meal]}</h3>
				</div>
				<ul class="divide-y divide-gray-100">
					{#each items as entry}
						<li class="px-4 sm:px-5 py-3 flex items-center gap-3">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 truncate">{entry.foodName}</p>
								<p class="text-xs text-gray-400">
									{entry.servingsConsumed} × {entry.servingSize}{entry.servingUnit}
									{#if entry.proteinG}· P: {Math.round(entry.proteinG)}g{/if}
									{#if entry.carbsG}· C: {Math.round(entry.carbsG)}g{/if}
									{#if entry.fatG}· F: {Math.round(entry.fatG)}g{/if}
								</p>
							</div>
							<span class="text-sm font-semibold text-gray-700 shrink-0">{entry.calories} cal</span>
							<button
								onclick={() => deleteEntry(entry.id)}
								class="text-gray-300 hover:text-red-400 transition-colors shrink-0"
								aria-label="Delete entry"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
{/if}
