<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const client = getContextClient();

	const ME_QUERY = gql`
		query GetProfile {
			me {
				id
				name
				email
				profile {
					displayName
					sex
					heightCm
					weightKg
					targetWeightKg
					dateOfBirth
					activityLevel
					goalType
					dailyCalorieGoal
					proteinGoalG
					carbsGoalG
					fatGoalG
				}
			}
		}
	`;

	const UPDATE_PROFILE = gql`
		mutation UpdateProfile($input: UpdateProfileInput!) {
			updateProfile(input: $input) {
				dailyCalorieGoal
				proteinGoalG
				carbsGoalG
				fatGoalG
				activityLevel
				goalType
			}
		}
	`;

	// Unit conversions
	const LBS_PER_KG = 2.20462;
	const CM_PER_IN = 2.54;

	function kgToLbs(kg: number) { return Math.round(kg * LBS_PER_KG * 2) / 2; }
	function lbsToKg(lbs: number) { return Math.round((lbs / LBS_PER_KG) * 10) / 10; }
	function cmToFtIn(cm: number) {
		const totalIn = cm / CM_PER_IN;
		return { ft: Math.floor(totalIn / 12), inches: Math.round(totalIn % 12) };
	}
	function ftInToCm(ft: number, inches: number) {
		return Math.round((ft * 12 + inches) * CM_PER_IN * 10) / 10;
	}

	// Internal state always in metric (kg / cm)
	let heightCm = $state<number | ''>(170);
	let weightKg = $state<number | ''>(70);
	let targetWeightKg = $state<number | ''>('');

	// Imperial display state
	let useImperial = $state(true); // default to lbs for US users
	let lbs = $state<number | ''>('');
	let targetLbs = $state<number | ''>('');
	let ft = $state<number | ''>(5);
	let inches = $state<number | ''>(10);

	// Sync imperial → metric when user edits imperial fields
	function onLbsChange() {
		if (lbs !== '') weightKg = lbsToKg(Number(lbs));
	}
	function onTargetLbsChange() {
		if (targetLbs !== '') targetWeightKg = lbsToKg(Number(targetLbs));
		else targetWeightKg = '';
	}
	function onFtInChange() {
		if (ft !== '' && inches !== '') heightCm = ftInToCm(Number(ft), Number(inches));
	}

	// Toggle: recompute display values from internal metric
	function toggleUnit() {
		useImperial = !useImperial;
		if (useImperial) {
			if (weightKg !== '') lbs = kgToLbs(Number(weightKg));
			if (targetWeightKg !== '') targetLbs = kgToLbs(Number(targetWeightKg));
			else targetLbs = '';
			if (heightCm !== '') {
				const { ft: f, inches: i } = cmToFtIn(Number(heightCm));
				ft = f;
				inches = i;
			}
		}
	}

	let meStore = $state(queryStore({ client, query: ME_QUERY }));
	const profile = $derived($meStore.data?.me?.profile);

	let displayName = $state('');
	let sex = $state('male');
	let dateOfBirth = $state('');
	let activityLevel = $state('SEDENTARY');
	let goalType = $state('MAINTAIN');
	let dailyCalorieGoal = $state(2000);
	let proteinGoalG = $state<number | ''>('');
	let carbsGoalG = $state<number | ''>('');
	let fatGoalG = $state<number | ''>('');

	let seeded = $state(false);

	$effect(() => {
		if (profile && !seeded) {
			displayName = profile.displayName ?? $meStore.data?.me?.name ?? '';
			sex = profile.sex ?? 'male';
			dateOfBirth = profile.dateOfBirth ?? '';
			activityLevel = profile.activityLevel ?? 'SEDENTARY';
			goalType = profile.goalType ?? 'MAINTAIN';
			dailyCalorieGoal = profile.dailyCalorieGoal ?? 2000;
			proteinGoalG = profile.proteinGoalG ?? '';
			carbsGoalG = profile.carbsGoalG ?? '';
			fatGoalG = profile.fatGoalG ?? '';

			// Seed metric values
			heightCm = profile.heightCm ? Number(profile.heightCm) : 170;
			weightKg = profile.weightKg ? Number(profile.weightKg) : 70;
			targetWeightKg = profile.targetWeightKg ? Number(profile.targetWeightKg) : '';

			// Seed imperial display
			lbs = kgToLbs(Number(weightKg));
			targetLbs = targetWeightKg !== '' ? kgToLbs(Number(targetWeightKg)) : '';
			const hf = cmToFtIn(Number(heightCm));
			ft = hf.ft;
			inches = hf.inches;

			seeded = true;
		}
	});

	// TDEE (Mifflin-St Jeor) — always uses internal metric
	function calculateTDEE() {
		if (!heightCm || !weightKg) return null;

		let age = 30;
		if (dateOfBirth) {
			age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
			if (age < 1 || age > 120) age = 30;
		}

		const bmr =
			sex === 'male'
				? 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * age + 5
				: 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * age - 161;

		const multipliers: Record<string, number> = {
			SEDENTARY: 1.2, LIGHTLY_ACTIVE: 1.375,
			MODERATELY_ACTIVE: 1.55, VERY_ACTIVE: 1.725, EXTRA_ACTIVE: 1.9
		};
		const adjustments: Record<string, number> = { LOSE: -500, MAINTAIN: 0, GAIN: 300 };

		return Math.round(bmr * (multipliers[activityLevel] ?? 1.2)) + (adjustments[goalType] ?? 0);
	}

	function roundTo50(n: number) { return Math.round(n / 50) * 50; }

	function applyTDEE() {
		const tdee = calculateTDEE();
		if (!tdee) return;
		dailyCalorieGoal = Math.max(1200, roundTo50(tdee));
		proteinGoalG = Math.round((dailyCalorieGoal * 0.3) / 4);
		carbsGoalG = Math.round((dailyCalorieGoal * 0.4) / 4);
		fatGoalG = Math.round((dailyCalorieGoal * 0.3) / 9);
	}

	const tdeeRaw = $derived(calculateTDEE());
	const tdeePreview = $derived(tdeeRaw != null ? roundTo50(tdeeRaw) : null);
	const caloriesFromMacros = $derived(
		proteinGoalG !== '' && carbsGoalG !== '' && fatGoalG !== ''
			? Number(proteinGoalG) * 4 + Number(carbsGoalG) * 4 + Number(fatGoalG) * 9
			: null
	);

	let saving = $state(false);
	let saved = $state(false);
	let saveError = $state('');

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		saving = true;
		saved = false;
		saveError = '';

		const result = await mutationStore({
			client,
			query: UPDATE_PROFILE,
			variables: {
				input: {
					displayName: displayName || undefined,
					sex,
					heightCm: heightCm !== '' ? Number(heightCm) : undefined,
					weightKg: weightKg !== '' ? Number(weightKg) : undefined,
					targetWeightKg: targetWeightKg !== '' ? Number(targetWeightKg) : undefined,
					dateOfBirth: dateOfBirth || undefined,
					activityLevel,
					goalType,
					dailyCalorieGoal: Number(dailyCalorieGoal),
					proteinGoalG: proteinGoalG !== '' ? Number(proteinGoalG) : undefined,
					carbsGoalG: carbsGoalG !== '' ? Number(carbsGoalG) : undefined,
					fatGoalG: fatGoalG !== '' ? Number(fatGoalG) : undefined
				}
			}
		});

		await new Promise<void>((resolve) => {
			const unsub = result.subscribe((s) => {
				if (!s.fetching) {
					unsub();
					if (s.error) {
						saveError = s.error.message;
					} else {
						saved = true;
						meStore = queryStore({ client, query: ME_QUERY, requestPolicy: 'network-only' });
						seeded = false;
					}
					resolve();
				}
			});
		});

		saving = false;
	}

	const activityOptions = [
		{ value: 'SEDENTARY', label: 'Sedentary', desc: 'Little or no exercise' },
		{ value: 'LIGHTLY_ACTIVE', label: 'Lightly Active', desc: '1–3 days/week' },
		{ value: 'MODERATELY_ACTIVE', label: 'Moderately Active', desc: '3–5 days/week' },
		{ value: 'VERY_ACTIVE', label: 'Very Active', desc: '6–7 days/week' },
		{ value: 'EXTRA_ACTIVE', label: 'Extra Active', desc: 'Physical job or 2× training' }
	];
</script>

<svelte:head>
	<title>Profile & Goals — Discipline</title>
</svelte:head>

{#if $meStore.fetching}
	<div class="flex items-center justify-center h-64">
		<div class="h-8 w-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
	</div>
{:else}
	<form onsubmit={handleSave} class="space-y-8 max-w-2xl">
		<div class="flex items-center justify-between flex-wrap gap-3">
			<h1 class="text-2xl font-bold text-gray-900">Profile & Goals</h1>
			<div class="flex items-center gap-3">
				<!-- Unit toggle -->
				<button
					type="button"
					onclick={toggleUnit}
					class="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
				>
					<span class="{useImperial ? 'text-brand-600 font-semibold' : 'text-gray-400'}">lbs / ft</span>
					<span class="text-gray-300">|</span>
					<span class="{!useImperial ? 'text-brand-600 font-semibold' : 'text-gray-400'}">kg / cm</span>
				</button>
				<button type="submit" class="btn-primary" disabled={saving}>
					{saving ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</div>

		{#if saved}
			<div class="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
				Goals saved successfully.
			</div>
		{/if}
		{#if saveError}
			<div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
				{saveError}
			</div>
		{/if}

		<!-- Personal Info -->
		<div class="card">
			<div class="card-header">
				<h2 class="font-semibold text-gray-900">Personal Info</h2>
			</div>
			<div class="card-body grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div>
					<label for="displayName" class="label">Display Name</label>
					<input id="displayName" type="text" bind:value={displayName} class="input" placeholder="How you appear to others" />
				</div>
				<div>
					<label for="dateOfBirth" class="label">Date of Birth</label>
					<input id="dateOfBirth" type="date" bind:value={dateOfBirth} class="input" />
				</div>
				<div>
					<label for="sex" class="label">Sex <span class="text-gray-400 font-normal">(used for calorie calc)</span></label>
					<select id="sex" bind:value={sex} class="input">
						<option value="male">Male</option>
						<option value="female">Female</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Body Stats -->
		<div class="card">
			<div class="card-header flex items-center justify-between">
				<h2 class="font-semibold text-gray-900">Body Stats</h2>
				<span class="text-xs text-gray-400">{useImperial ? 'Imperial' : 'Metric'}</span>
			</div>
			<div class="card-body grid grid-cols-1 gap-5 sm:grid-cols-3">
				<!-- Height -->
				{#if useImperial}
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="label">Height</label>
						<div class="flex gap-2">
							<div class="flex-1 relative">
								<input
									type="number"
									bind:value={ft}
									min="3" max="8" step="1"
									class="input pr-8"
									placeholder="5"
									aria-label="Feet"
									oninput={onFtInChange}
								/>
								<span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">ft</span>
							</div>
							<div class="flex-1 relative">
								<input
									type="number"
									bind:value={inches}
									min="0" max="11" step="1"
									class="input pr-8"
									placeholder="10"
									aria-label="Inches"
									oninput={onFtInChange}
								/>
								<span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">in</span>
							</div>
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="label">Current Weight</label>
						<div class="relative">
							<input
								type="number"
								bind:value={lbs}
								min="60" max="700" step="0.5"
								class="input pr-10"
								placeholder="160"
								aria-label="Current weight in pounds"
								oninput={onLbsChange}
							/>
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">lbs</span>
						</div>
					</div>
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="label">Target Weight</label>
						<div class="relative">
							<input
								type="number"
								bind:value={targetLbs}
								min="60" max="700" step="0.5"
								class="input pr-10"
								placeholder="Optional"
								aria-label="Target weight in pounds"
								oninput={onTargetLbsChange}
							/>
							<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">lbs</span>
						</div>
					</div>
				{:else}
					<div>
						<label for="heightCm" class="label">Height (cm)</label>
						<input id="heightCm" type="number" bind:value={heightCm} min="100" max="250" step="0.5" class="input" placeholder="170" />
					</div>
					<div>
						<label for="weightKg" class="label">Current Weight (kg)</label>
						<input id="weightKg" type="number" bind:value={weightKg} min="30" max="300" step="0.1" class="input" placeholder="70" />
					</div>
					<div>
						<label for="targetWeightKg" class="label">Target Weight (kg)</label>
						<input id="targetWeightKg" type="number" bind:value={targetWeightKg} min="30" max="300" step="0.1" class="input" placeholder="Optional" />
					</div>
				{/if}
			</div>
			{#if useImperial && heightCm && weightKg}
				<div class="px-4 pb-4 sm:px-6 text-xs text-gray-400">
					Stored as {heightCm} cm · {weightKg} kg
				</div>
			{/if}
		</div>

		<!-- Activity Level -->
		<div class="card">
			<div class="card-header">
				<h2 class="font-semibold text-gray-900">Activity Level</h2>
			</div>
			<div class="card-body space-y-2">
				{#each activityOptions as opt}
					<label class="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors
						{activityLevel === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}">
						<input type="radio" bind:group={activityLevel} value={opt.value} class="accent-brand-600" />
						<div>
							<p class="text-sm font-medium text-gray-900">{opt.label}</p>
							<p class="text-xs text-gray-400">{opt.desc}</p>
						</div>
					</label>
				{/each}
			</div>
		</div>

		<!-- Goal Type -->
		<div class="card">
			<div class="card-header">
				<h2 class="font-semibold text-gray-900">Goal</h2>
			</div>
			<div class="card-body grid grid-cols-3 gap-3">
				{#each [
					{ value: 'LOSE', label: 'Lose Weight', icon: '↓', desc: '−500 cal/day' },
					{ value: 'MAINTAIN', label: 'Maintain', icon: '→', desc: 'TDEE target' },
					{ value: 'GAIN', label: 'Build / Gain', icon: '↑', desc: '+300 cal/day' }
				] as opt}
					<label class="flex flex-col items-center gap-1 rounded-xl border p-4 cursor-pointer transition-colors text-center
						{goalType === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}">
						<input type="radio" bind:group={goalType} value={opt.value} class="sr-only" />
						<span class="text-2xl">{opt.icon}</span>
						<span class="text-sm font-semibold text-gray-900">{opt.label}</span>
						<span class="text-xs text-gray-400">{opt.desc}</span>
					</label>
				{/each}
			</div>
		</div>

		<!-- Calorie & Macro Goals -->
		<div class="card">
			<div class="card-header flex items-center justify-between flex-wrap gap-3">
				<div>
					<h2 class="font-semibold text-gray-900">Calorie & Macro Goals</h2>
					{#if tdeePreview}
						<p class="text-xs text-gray-400 mt-0.5">
							Estimated daily target: <span class="font-semibold text-brand-600">{tdeePreview.toLocaleString()} cal</span>
							{#if !dateOfBirth}<span> · using age 30 (enter DOB for accuracy)</span>{/if}
						</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={applyTDEE}
					disabled={!tdeePreview}
					class="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
				>
					Calculate from stats
				</button>
			</div>
			<div class="card-body space-y-5">
				<div>
					<label for="dailyCalorieGoal" class="label">Daily Calorie Goal</label>
					<div class="flex items-center gap-3">
						<input id="dailyCalorieGoal" type="number" bind:value={dailyCalorieGoal} min="1000" max="10000" step="50" class="input max-w-xs" />
						<span class="text-sm text-gray-400">calories / day</span>
					</div>
				</div>
				<div>
					<p class="label mb-3">Macro Goals <span class="text-gray-400 font-normal">(optional)</span></p>
					<div class="grid grid-cols-3 gap-4">
						<div>
							<label for="proteinGoalG" class="label text-blue-600 text-xs">Protein (g)</label>
							<input id="proteinGoalG" type="number" bind:value={proteinGoalG} min="0" step="1" class="input" placeholder="—" />
							{#if proteinGoalG !== ''}
								<p class="text-xs text-gray-400 mt-1">{Number(proteinGoalG) * 4} cal</p>
							{/if}
						</div>
						<div>
							<label for="carbsGoalG" class="label text-amber-600 text-xs">Carbs (g)</label>
							<input id="carbsGoalG" type="number" bind:value={carbsGoalG} min="0" step="1" class="input" placeholder="—" />
							{#if carbsGoalG !== ''}
								<p class="text-xs text-gray-400 mt-1">{Number(carbsGoalG) * 4} cal</p>
							{/if}
						</div>
						<div>
							<label for="fatGoalG" class="label text-rose-500 text-xs">Fat (g)</label>
							<input id="fatGoalG" type="number" bind:value={fatGoalG} min="0" step="1" class="input" placeholder="—" />
							{#if fatGoalG !== ''}
								<p class="text-xs text-gray-400 mt-1">{Number(fatGoalG) * 9} cal</p>
							{/if}
						</div>
					</div>
					{#if caloriesFromMacros !== null}
						<p class="text-xs mt-3 {Math.abs(caloriesFromMacros - Number(dailyCalorieGoal)) > 100 ? 'text-amber-600' : 'text-gray-400'}">
							Macros total: {caloriesFromMacros} cal
							{#if Math.abs(caloriesFromMacros - Number(dailyCalorieGoal)) > 100}
								— off from calorie goal by {Math.abs(caloriesFromMacros - Number(dailyCalorieGoal))} cal
							{/if}
						</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex justify-end">
			<button type="submit" class="btn-primary" disabled={saving}>
				{saving ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	</form>
{/if}
