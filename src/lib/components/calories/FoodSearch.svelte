<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';

	let {
		date,
		onAdded,
		onCancel
	}: {
		date: string;
		onAdded: () => void;
		onCancel: () => void;
	} = $props();

	const client = getContextClient();

	let searchQuery = $state('');
	let selectedFood = $state<{
		id: string;
		name: string;
		caloriesPerServing: number;
		servingSize: number;
		servingUnit: string;
		proteinG?: number;
		carbsG?: number;
		fatG?: number;
	} | null>(null);
	let servings = $state(1);
	let mealType = $state<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER'>('OTHER');
	let error = $state('');

	const searchStore = $derived(
		searchQuery.trim().length >= 2
			? queryStore({
					client,
					query: gql`
						query SearchFoods($q: String!) {
							searchFoods(query: $q, limit: 15) {
								id
								name
								brand
								caloriesPerServing
								servingSize
								servingUnit
								proteinG
								carbsG
								fatG
							}
						}
					`,
					variables: { q: searchQuery.trim() }
				})
			: null
	);

	const ADD_FOOD_MUTATION = gql`
		mutation AddFoodEntry($input: AddFoodEntryInput!) {
			addFoodEntry(input: $input) {
				id
				calories
				foodName
			}
		}
	`;

	let adding = $state(false);

	async function handleAdd() {
		if (!selectedFood) return;
		error = '';
		adding = true;
		const calories = Math.round(selectedFood.caloriesPerServing * servings);

		const result = await mutationStore({
			client,
			query: ADD_FOOD_MUTATION,
			variables: {
				input: {
					date,
					foodItemId: selectedFood.id,
					foodName: selectedFood.name,
					servingSize: selectedFood.servingSize,
					servingUnit: selectedFood.servingUnit,
					servingsConsumed: servings,
					calories,
					proteinG: selectedFood.proteinG != null ? selectedFood.proteinG * servings : undefined,
					carbsG: selectedFood.carbsG != null ? selectedFood.carbsG * servings : undefined,
					fatG: selectedFood.fatG != null ? selectedFood.fatG * servings : undefined,
					mealType
				}
			}
		});

		// Wait for the mutation to settle
		await new Promise<void>((resolve) => {
			const unsub = result.subscribe((s) => {
				if (!s.fetching) {
					unsub();
					if (s.error) {
						error = s.error.message;
						adding = false;
					} else {
						resolve();
					}
				}
			});
		});

		if (!error) {
			adding = false;
			onAdded();
		}
	}

	function selectFood(food: typeof selectedFood) {
		selectedFood = food;
		servings = 1;
	}

	const estimatedCalories = $derived(
		selectedFood ? Math.round(selectedFood.caloriesPerServing * servings) : 0
	);
</script>

<div class="card">
	<div class="card-header flex items-center justify-between">
		<h3 class="font-semibold text-gray-900">Search Food</h3>
		<button onclick={onCancel} class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
	</div>
	<div class="card-body space-y-4">
		<input
			type="search"
			bind:value={searchQuery}
			class="input"
			placeholder="Search foods (e.g. chicken breast, apple)…"
			autofocus
		/>

		{#if searchStore && $searchStore.fetching}
			<p class="text-sm text-gray-400 text-center py-2">Searching…</p>
		{:else if searchStore && $searchStore.data?.searchFoods?.length}
			{#if !selectedFood}
				<ul class="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
					{#each $searchStore.data.searchFoods as food}
						<li>
							<button
								onclick={() => selectFood(food)}
								class="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors"
							>
								<p class="text-sm font-medium text-gray-900">{food.name}</p>
								<p class="text-xs text-gray-400">
									{food.caloriesPerServing} cal · {food.servingSize}{food.servingUnit}
									{food.brand ? `· ${food.brand}` : ''}
								</p>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		{:else if searchQuery.trim().length >= 2 && searchStore && !$searchStore.fetching}
			<p class="text-sm text-gray-400 text-center py-2">No results found.</p>
		{/if}

		{#if selectedFood}
			<div class="rounded-lg bg-brand-50 border border-brand-200 p-4 space-y-3">
				<div class="flex items-start justify-between">
					<div>
						<p class="font-medium text-gray-900">{selectedFood.name}</p>
						<p class="text-sm text-gray-500">
							{selectedFood.servingSize}{selectedFood.servingUnit} per serving
						</p>
					</div>
					<button onclick={() => (selectedFood = null)} class="text-gray-400 hover:text-gray-600 ml-2">&times;</button>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="label text-xs">Servings</label>
						<input
							type="number"
							bind:value={servings}
							min="0.25"
							step="0.25"
							class="input"
						/>
					</div>
					<div>
						<label class="label text-xs">Meal</label>
						<select bind:value={mealType} class="input">
							<option value="BREAKFAST">Breakfast</option>
							<option value="LUNCH">Lunch</option>
							<option value="DINNER">Dinner</option>
							<option value="SNACK">Snack</option>
							<option value="OTHER">Other</option>
						</select>
					</div>
				</div>

				<div class="flex items-center justify-between pt-1">
					<span class="text-sm font-semibold text-gray-900">{estimatedCalories} calories</span>
					<button onclick={handleAdd} class="btn-primary" disabled={adding}>
						{adding ? 'Adding…' : 'Add to log'}
					</button>
				</div>

				{#if error}
					<p class="text-xs text-red-600">{error}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
