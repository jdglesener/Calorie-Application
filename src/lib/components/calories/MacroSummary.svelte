<script lang="ts">
	let {
		calories,
		calorieGoal,
		protein,
		carbs,
		fat,
		proteinGoal,
		carbsGoal,
		fatGoal
	}: {
		calories: number;
		calorieGoal: number;
		protein: number;
		carbs: number;
		fat: number;
		proteinGoal?: number | null;
		carbsGoal?: number | null;
		fatGoal?: number | null;
	} = $props();

	const pct = $derived(Math.min(100, Math.round((calories / calorieGoal) * 100)));
	const remaining = $derived(calorieGoal - calories);
	const barColor = $derived(
		pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-brand-500'
	);

	function macroPct(consumed: number, goal: number | null | undefined) {
		if (!goal) return null;
		return Math.min(100, Math.round((consumed / goal) * 100));
	}

	const proteinPct = $derived(macroPct(protein, proteinGoal));
	const carbsPct = $derived(macroPct(carbs, carbsGoal));
	const fatPct = $derived(macroPct(fat, fatGoal));
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
		<!-- Protein -->
		<div class="space-y-1">
			<div class="flex justify-between items-baseline">
				<p class="text-xs text-gray-400">Protein</p>
				{#if proteinGoal}
					<p class="text-xs text-gray-400">{Math.round(protein)}/{proteinGoal}g</p>
				{/if}
			</div>
			<p class="text-base font-semibold text-blue-600">{Math.round(protein)}g</p>
			{#if proteinPct !== null}
				<div class="h-1.5 w-full rounded-full bg-blue-100 overflow-hidden">
					<div class="h-full rounded-full bg-blue-500 transition-all" style="width: {proteinPct}%"></div>
				</div>
			{/if}
		</div>

		<!-- Carbs -->
		<div class="space-y-1">
			<div class="flex justify-between items-baseline">
				<p class="text-xs text-gray-400">Carbs</p>
				{#if carbsGoal}
					<p class="text-xs text-gray-400">{Math.round(carbs)}/{carbsGoal}g</p>
				{/if}
			</div>
			<p class="text-base font-semibold text-amber-600">{Math.round(carbs)}g</p>
			{#if carbsPct !== null}
				<div class="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
					<div class="h-full rounded-full bg-amber-400 transition-all" style="width: {carbsPct}%"></div>
				</div>
			{/if}
		</div>

		<!-- Fat -->
		<div class="space-y-1">
			<div class="flex justify-between items-baseline">
				<p class="text-xs text-gray-400">Fat</p>
				{#if fatGoal}
					<p class="text-xs text-gray-400">{Math.round(fat)}/{fatGoal}g</p>
				{/if}
			</div>
			<p class="text-base font-semibold text-rose-500">{Math.round(fat)}g</p>
			{#if fatPct !== null}
				<div class="h-1.5 w-full rounded-full bg-rose-100 overflow-hidden">
					<div class="h-full rounded-full bg-rose-400 transition-all" style="width: {fatPct}%"></div>
				</div>
			{/if}
		</div>
	</div>
</div>
