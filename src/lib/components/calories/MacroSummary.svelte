<script lang="ts">
	let {
		calories,
		calorieGoal,
		protein,
		carbs,
		fat
	}: {
		calories: number;
		calorieGoal: number;
		protein: number;
		carbs: number;
		fat: number;
	} = $props();

	const pct = $derived(Math.min(100, Math.round((calories / calorieGoal) * 100)));
	const remaining = $derived(calorieGoal - calories);
	const barColor = $derived(
		pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-brand-500'
	);
</script>

<div class="card card-body space-y-4">
	<div class="flex items-end justify-between">
		<div>
			<p class="text-3xl font-bold text-gray-900">{calories.toLocaleString()}</p>
			<p class="text-sm text-gray-400">of {calorieGoal.toLocaleString()} cal goal</p>
		</div>
		<div class="text-right">
			<p class="text-lg font-semibold {remaining < 0 ? 'text-red-600' : 'text-brand-600'}">
				{remaining < 0 ? '+' : ''}{Math.abs(remaining).toLocaleString()}
			</p>
			<p class="text-xs text-gray-400">{remaining < 0 ? 'over goal' : 'remaining'}</p>
		</div>
	</div>

	<!-- Calorie progress bar -->
	<div class="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
		<div
			class="h-full rounded-full transition-all duration-500 {barColor}"
			style="width: {pct}%"
		></div>
	</div>

	<!-- Macro breakdown -->
	<div class="grid grid-cols-3 gap-4 pt-1">
		<div class="text-center">
			<p class="text-base font-semibold text-blue-600">{Math.round(protein)}g</p>
			<p class="text-xs text-gray-400">Protein</p>
		</div>
		<div class="text-center">
			<p class="text-base font-semibold text-amber-600">{Math.round(carbs)}g</p>
			<p class="text-xs text-gray-400">Carbs</p>
		</div>
		<div class="text-center">
			<p class="text-base font-semibold text-rose-500">{Math.round(fat)}g</p>
			<p class="text-xs text-gray-400">Fat</p>
		</div>
	</div>
</div>
