<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import { browser } from '$app/environment';
	import BarcodeScanner from './BarcodeScanner.svelte';

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

	type FoodItem = {
		id: string;
		name: string;
		caloriesPerServing: number;
		servingSize: number;
		servingUnit: string;
		proteinG?: number | null;
		carbsG?: number | null;
		fatG?: number | null;
	};

	const canScan = browser && !!navigator.mediaDevices?.getUserMedia;

	let mode = $state<'search' | 'create'>('search');
	let showScanner = $state(false);
	let lookingUp = $state(false);
	let lookupError = $state('');
	let searchQuery = $state('');
	let selectedFood = $state<FoodItem | null>(null);
	let servings = $state(1);
	let mealType = $state<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER'>('OTHER');
	let error = $state('');

	// Create form state
	let createName = $state('');
	let createBrand = $state('');
	let createServingSize = $state<number | ''>(1);
	let createServingUnit = $state('serving');
	let createCalories = $state<number | ''>('');
	let createProtein = $state<number | ''>('');
	let createCarbs = $state<number | ''>('');
	let createFat = $state<number | ''>('');
	let creating = $state(false);

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

	const LOOKUP_BARCODE_QUERY = gql`
		query LookupBarcode($barcode: String!) {
			lookupBarcode(barcode: $barcode) {
				id
				name
				caloriesPerServing
				servingSize
				servingUnit
				proteinG
				carbsG
				fatG
			}
		}
	`;

	const ADD_FOOD_MUTATION = gql`
		mutation AddFoodEntry($input: AddFoodEntryInput!) {
			addFoodEntry(input: $input) {
				id
				calories
				foodName
			}
		}
	`;

	const CREATE_FOOD_MUTATION = gql`
		mutation CreateFoodItem($input: CreateFoodItemInput!) {
			createFoodItem(input: $input) {
				id
				name
				caloriesPerServing
				servingSize
				servingUnit
				proteinG
				carbsG
				fatG
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

	async function handleCreate() {
		if (!createName || createCalories === '' || createServingSize === '') return;
		error = '';
		creating = true;

		const result = await mutationStore({
			client,
			query: CREATE_FOOD_MUTATION,
			variables: {
				input: {
					name: createName.trim(),
					brand: createBrand.trim() || undefined,
					servingSize: Number(createServingSize),
					servingUnit: createServingUnit.trim() || 'serving',
					caloriesPerServing: Number(createCalories),
					proteinG: createProtein !== '' ? Number(createProtein) : undefined,
					carbsG: createCarbs !== '' ? Number(createCarbs) : undefined,
					fatG: createFat !== '' ? Number(createFat) : undefined
				}
			}
		});

		await new Promise<void>((resolve) => {
			const unsub = result.subscribe((s) => {
				if (!s.fetching) {
					unsub();
					if (s.error) {
						error = s.error.message;
						creating = false;
					} else if (s.data?.createFoodItem) {
						selectFood(s.data.createFoodItem);
						mode = 'search';
						resolve();
					}
				}
			});
		});

		creating = false;
	}

	async function handleScanned(code: string) {
		showScanner = false;
		lookingUp = true;
		lookupError = '';

		const result = await client.query(LOOKUP_BARCODE_QUERY, { barcode: code }).toPromise();
		lookingUp = false;

		if (result.data?.lookupBarcode) {
			selectFood(result.data.lookupBarcode);
		} else {
			lookupError = `No product found for barcode ${code}. Try searching by name or create a custom food.`;
		}
	}

	function selectFood(food: FoodItem) {
		selectedFood = food;
		servings = 1;
	}

	const estimatedCalories = $derived(
		selectedFood ? Math.round(selectedFood.caloriesPerServing * servings) : 0
	);

	const noResults = $derived(
		searchQuery.trim().length >= 2 &&
		searchStore &&
		!$searchStore?.fetching &&
		!$searchStore?.data?.searchFoods?.length
	);
</script>

{#if showScanner}
	<BarcodeScanner onScanned={handleScanned} onCancel={() => (showScanner = false)} />
{/if}

<div class="card">
	<div class="card-header flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h3 class="font-semibold text-gray-900">
				{mode === 'create' ? 'Create Custom Food' : 'Search Food'}
			</h3>
			{#if mode === 'create'}
				<button
					onclick={() => { mode = 'search'; error = ''; }}
					class="text-xs text-brand-600 hover:underline"
				>← Back to search</button>
			{/if}
		</div>
		<button onclick={onCancel} class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
	</div>

	<div class="card-body space-y-4">
		{#if mode === 'search'}
			<div class="flex gap-2">
				<input
					type="search"
					bind:value={searchQuery}
					class="input flex-1"
					placeholder="Search foods (e.g. chicken breast, apple)…"
					autofocus
				/>
				{#if canScan}
					<button
						type="button"
						onclick={() => { showScanner = true; lookupError = ''; }}
						class="btn-secondary shrink-0 px-3"
						title="Scan barcode"
						disabled={lookingUp}
					>
						{#if lookingUp}
							<div class="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
						{:else}
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
							</svg>
						{/if}
					</button>
				{/if}
			</div>

			{#if lookupError}
				<p class="text-xs text-amber-600">{lookupError}</p>
			{/if}

			{#if searchStore && $searchStore.fetching}
				<p class="text-sm text-gray-400 text-center py-2">Searching…</p>
			{:else if searchStore && $searchStore.data?.searchFoods?.length && !selectedFood}
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
			{:else if noResults}
				<p class="text-sm text-gray-400 text-center py-2">No results found.</p>
			{/if}

			{#if !selectedFood && (noResults || searchQuery.trim().length === 0)}
				<button
					onclick={() => { mode = 'create'; error = ''; }}
					class="w-full text-sm text-brand-600 hover:text-brand-700 py-1 text-center hover:underline"
				>
					+ Create custom food
				</button>
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

		{:else}
			<!-- Create custom food form -->
			<div class="space-y-4">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<label class="label text-xs">Food name <span class="text-red-400">*</span></label>
						<input type="text" bind:value={createName} class="input" placeholder="e.g. Homemade granola" autofocus />
					</div>
					<div class="sm:col-span-2">
						<label class="label text-xs">Brand <span class="text-gray-400 font-normal">(optional)</span></label>
						<input type="text" bind:value={createBrand} class="input" placeholder="e.g. Trader Joe's" />
					</div>
					<div>
						<label class="label text-xs">Serving size <span class="text-red-400">*</span></label>
						<input type="number" bind:value={createServingSize} min="0.1" step="0.1" class="input" placeholder="1" />
					</div>
					<div>
						<label class="label text-xs">Serving unit <span class="text-red-400">*</span></label>
						<input type="text" bind:value={createServingUnit} class="input" placeholder="serving, cup, oz…" />
					</div>
					<div class="sm:col-span-2">
						<label class="label text-xs">Calories per serving <span class="text-red-400">*</span></label>
						<input type="number" bind:value={createCalories} min="0" step="1" class="input" placeholder="0" />
					</div>
				</div>

				<div>
					<p class="label text-xs mb-2">Macros per serving <span class="text-gray-400 font-normal">(optional)</span></p>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label class="label text-xs text-blue-600">Protein (g)</label>
							<input type="number" bind:value={createProtein} min="0" step="0.1" class="input" placeholder="—" />
						</div>
						<div>
							<label class="label text-xs text-amber-600">Carbs (g)</label>
							<input type="number" bind:value={createCarbs} min="0" step="0.1" class="input" placeholder="—" />
						</div>
						<div>
							<label class="label text-xs text-rose-500">Fat (g)</label>
							<input type="number" bind:value={createFat} min="0" step="0.1" class="input" placeholder="—" />
						</div>
					</div>
				</div>

				{#if error}
					<p class="text-xs text-red-600">{error}</p>
				{/if}

				<div class="flex justify-end gap-2 pt-1">
					<button
						type="button"
						onclick={() => { mode = 'search'; error = ''; }}
						class="btn-secondary"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleCreate}
						class="btn-primary"
						disabled={creating || !createName || createCalories === '' || createServingSize === ''}
					>
						{creating ? 'Creating…' : 'Create & select'}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
