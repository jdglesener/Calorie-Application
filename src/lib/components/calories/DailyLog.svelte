<script lang="ts">
	import { mutationStore, gql, getContextClient } from '@urql/svelte';

	type Entry = {
		id: string;
		foodName: string;
		servingsConsumed: number;
		servingSize: number;
		servingUnit: string;
		calories: number;
		proteinG?: number | null;
		carbsG?: number | null;
		fatG?: number | null;
		mealType: string;
		loggedAt: string;
	};

	let {
		entries,
		date,
		onDeleted,
		onEdited
	}: {
		entries: Entry[];
		date: string;
		onDeleted: () => void;
		onEdited: () => void;
	} = $props();

	const client = getContextClient();

	const DELETE_MUTATION = gql`
		mutation DeleteFoodEntry($id: ID!) {
			deleteFoodEntry(id: $id)
		}
	`;

	const UPDATE_MUTATION = gql`
		mutation UpdateFoodEntry($id: ID!, $input: UpdateFoodEntryInput!) {
			updateFoodEntry(id: $id, input: $input) {
				id
				servingsConsumed
				calories
				mealType
			}
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

	let editingId = $state<string | null>(null);
	let editServings = $state(1);
	let editMealType = $state('OTHER');
	let saving = $state(false);

	function startEdit(entry: Entry) {
		editingId = entry.id;
		editServings = entry.servingsConsumed;
		editMealType = entry.mealType;
	}

	function cancelEdit() {
		editingId = null;
	}

	function getEditCalories(entry: Entry) {
		return Math.round((entry.calories / entry.servingsConsumed) * editServings);
	}

	async function saveEdit(entry: Entry) {
		saving = true;
		const calsPerServing = entry.calories / entry.servingsConsumed;
		const newCalories = Math.round(calsPerServing * editServings);
		const newProtein =
			entry.proteinG != null ? (entry.proteinG / entry.servingsConsumed) * editServings : undefined;
		const newCarbs =
			entry.carbsG != null ? (entry.carbsG / entry.servingsConsumed) * editServings : undefined;
		const newFat =
			entry.fatG != null ? (entry.fatG / entry.servingsConsumed) * editServings : undefined;

		await mutationStore({
			client,
			query: UPDATE_MUTATION,
			variables: {
				id: entry.id,
				input: {
					servingsConsumed: editServings,
					calories: newCalories,
					proteinG: newProtein,
					carbsG: newCarbs,
					fatG: newFat,
					mealType: editMealType
				}
			}
		}).toPromise?.();

		saving = false;
		editingId = null;
		onEdited();
	}

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
						<li class="px-4 sm:px-5 py-3">
							{#if editingId === entry.id}
								<!-- Inline edit form -->
								<div class="space-y-3">
									<p class="text-sm font-medium text-gray-900">{entry.foodName}</p>
									<div class="grid grid-cols-2 gap-3">
										<div>
											<label class="label text-xs">Servings</label>
											<input
												type="number"
												bind:value={editServings}
												min="0.25"
												step="0.25"
												class="input"
											/>
										</div>
										<div>
											<label class="label text-xs">Meal</label>
											<select bind:value={editMealType} class="input">
												<option value="BREAKFAST">Breakfast</option>
												<option value="LUNCH">Lunch</option>
												<option value="DINNER">Dinner</option>
												<option value="SNACK">Snack</option>
												<option value="OTHER">Other</option>
											</select>
										</div>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm font-semibold text-gray-700">
											{getEditCalories(entry)} cal
										</span>
										<div class="flex gap-2">
											<button
												onclick={cancelEdit}
												class="btn-secondary text-xs py-1 px-3"
											>
												Cancel
											</button>
											<button
												onclick={() => saveEdit(entry)}
												class="btn-primary text-xs py-1 px-3"
												disabled={saving}
											>
												{saving ? 'Saving…' : 'Save'}
											</button>
										</div>
									</div>
								</div>
							{:else}
								<!-- Normal row -->
								<div class="flex items-center gap-3">
									<button
										onclick={() => startEdit(entry)}
										class="flex-1 min-w-0 text-left"
									>
										<p class="text-sm font-medium text-gray-900 truncate">{entry.foodName}</p>
										<p class="text-xs text-gray-400">
											{entry.servingsConsumed} × {entry.servingSize}{entry.servingUnit}
											{#if entry.proteinG}· P: {Math.round(entry.proteinG)}g{/if}
											{#if entry.carbsG}· C: {Math.round(entry.carbsG)}g{/if}
											{#if entry.fatG}· F: {Math.round(entry.fatG)}g{/if}
										</p>
									</button>
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
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
{/if}
