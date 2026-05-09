<script lang="ts">
	import { queryStore, mutationStore, gql, getContextClient } from '@urql/svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const client = getContextClient();

	const FRIENDS_QUERY = gql`
		query FriendsForInvite {
			friends {
				id
				friend {
					id
					name
					displayName
					avatarUrl
				}
			}
		}
	`;

	const CREATE_CHALLENGE_MUTATION = gql`
		mutation CreateChallenge($input: CreateChallengeInput!) {
			createChallenge(input: $input) {
				id
				name
				status
			}
		}
	`;

	const friendsStore = $derived(queryStore({ client, query: FRIENDS_QUERY }));
	const friends = $derived($friendsStore.data?.friends ?? []);

	let name = $state('');
	let description = $state('');
	let challengeType = $state('CALORIE_LIMIT');
	let targetValue = $state<number | ''>('');
	let startDate = $state(data.today);
	let endDate = $state('');
	let isPublic = $state(false);
	let inviteUserIds = $state<string[]>([]);
	let submitting = $state(false);
	let error = $state('');

	const typeOptions = [
		{ value: 'CALORIE_LIMIT', label: 'Calorie Limit', targetLabel: 'Daily calorie limit' },
		{ value: 'CALORIE_GOAL', label: 'Calorie Goal', targetLabel: 'Daily calorie goal' },
		{ value: 'STEP_GOAL', label: 'Step Goal', targetLabel: 'Daily step goal' },
		{ value: 'EXERCISE_MINUTES', label: 'Exercise Minutes', targetLabel: 'Daily exercise minutes' },
		{ value: 'CUSTOM', label: 'Custom', targetLabel: 'Target value' }
	];

	const currentTypeOption = $derived(typeOptions.find((o) => o.value === challengeType));

	const canSubmit = $derived(
		!!name.trim() && !!targetValue && !!endDate && endDate > startDate && !submitting
	);

	function toggleInvite(userId: string) {
		if (inviteUserIds.includes(userId)) {
			inviteUserIds = inviteUserIds.filter((id) => id !== userId);
		} else {
			inviteUserIds = [...inviteUserIds, userId];
		}
	}

	async function submit() {
		if (!canSubmit) return;
		submitting = true;
		error = '';

		const result = await mutationStore({
			client,
			query: CREATE_CHALLENGE_MUTATION,
			variables: {
				input: {
					name: name.trim(),
					description: description.trim() || undefined,
					challengeType,
					targetValue: Number(targetValue),
					startDate,
					endDate,
					isPublic,
					inviteUserIds: inviteUserIds.length ? inviteUserIds : undefined
				}
			}
		}).toPromise?.();

		submitting = false;

		if (result?.error) {
			error = result.error.message ?? 'Something went wrong.';
			return;
		}

		const id = result?.data?.createChallenge?.id;
		if (id) await goto('/challenges/' + id);
	}
</script>

<svelte:head><title>New Challenge — Discipline</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/challenges" class="text-sm text-gray-400 hover:text-gray-600">← Cancel</a>
		<h1 class="text-2xl font-bold text-gray-900">New Challenge</h1>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
	{/if}

	<!-- Basic Info -->
	<div class="card card-body space-y-4">
		<h2 class="font-semibold text-gray-900">Details</h2>

		<div>
			<label for="name" class="label">Challenge Name</label>
			<input id="name" type="text" bind:value={name} placeholder="e.g. January Calorie Challenge" class="input" maxlength="100" />
		</div>

		<div>
			<label for="description" class="label">Description <span class="text-gray-400 font-normal">(optional)</span></label>
			<textarea id="description" bind:value={description} rows="2" class="input resize-none" maxlength="1000"></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="type" class="label">Type</label>
				<select id="type" bind:value={challengeType} class="input">
					{#each typeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="target" class="label">{currentTypeOption?.targetLabel ?? 'Target'}</label>
				<input id="target" type="number" bind:value={targetValue} min="1" class="input" />
			</div>
		</div>
	</div>

	<!-- Schedule -->
	<div class="card card-body space-y-4">
		<h2 class="font-semibold text-gray-900">Schedule</h2>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="start" class="label">Start Date</label>
				<input id="start" type="date" bind:value={startDate} class="input" />
			</div>
			<div>
				<label for="end" class="label">End Date</label>
				<input id="end" type="date" bind:value={endDate} min={startDate} class="input" />
			</div>
		</div>
		{#if endDate && endDate <= startDate}
			<p class="text-sm text-red-600">End date must be after start date.</p>
		{/if}
	</div>

	<!-- Visibility -->
	<div class="card card-body">
		<div class="flex items-center justify-between">
			<div>
				<p class="font-semibold text-gray-900">Public Challenge</p>
				<p class="text-xs text-gray-400 mt-0.5">Visible to anyone, not just invited friends</p>
			</div>
			<button
				role="switch"
				aria-checked={isPublic}
				onclick={() => (isPublic = !isPublic)}
				class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
					{isPublic ? 'bg-brand-600' : 'bg-gray-200'}"
			>
				<span
					class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
						{isPublic ? 'translate-x-6' : 'translate-x-1'}"
				></span>
			</button>
		</div>
	</div>

	<!-- Invite Friends -->
	{#if friends.length > 0}
		<div class="card card-body space-y-3">
			<h2 class="font-semibold text-gray-900">Invite Friends <span class="text-gray-400 font-normal text-sm">(optional)</span></h2>
			<ul class="space-y-2">
				{#each friends as conn}
					{@const displayName = conn.friend.displayName ?? conn.friend.name}
					{@const initial = displayName.charAt(0).toUpperCase()}
					{@const checked = inviteUserIds.includes(conn.friend.id)}
					<li>
						<label class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
							<input
								type="checkbox"
								{checked}
								onchange={() => toggleInvite(conn.friend.id)}
								class="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
							/>
							{#if conn.friend.avatarUrl}
								<img src={conn.friend.avatarUrl} alt={displayName} class="h-8 w-8 rounded-full object-cover" />
							{:else}
								<div class="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
									{initial}
								</div>
							{/if}
							<span class="text-sm text-gray-900">{displayName}</span>
						</label>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Submit -->
	<button onclick={submit} disabled={!canSubmit} class="btn-primary w-full">
		{submitting ? 'Creating…' : 'Create Challenge'}
	</button>
</div>
