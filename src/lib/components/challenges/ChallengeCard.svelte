<script lang="ts">
	type Participant = { user: { id: string }; status: string };
	type Creator = { id: string; name: string; displayName?: string | null };

	type Challenge = {
		id: string;
		name: string;
		description?: string | null;
		challengeType: string;
		targetValue: number;
		startDate: string;
		endDate: string;
		isPublic: boolean;
		status: string;
		creator: Creator;
		participants: Participant[];
	};

	let { challenge, currentUserId }: { challenge: Challenge; currentUserId: string } = $props();

	const typeLabels: Record<string, string> = {
		CALORIE_LIMIT: 'Calorie Limit',
		CALORIE_GOAL: 'Calorie Goal',
		STEP_GOAL: 'Step Goal',
		EXERCISE_MINUTES: 'Exercise Minutes',
		CUSTOM: 'Custom'
	};

	const statusColors: Record<string, string> = {
		ACTIVE: 'bg-green-100 text-green-700',
		DRAFT: 'bg-gray-100 text-gray-500',
		COMPLETED: 'bg-blue-100 text-blue-700',
		CANCELLED: 'bg-red-100 text-red-500'
	};

	const userParticipant = $derived(
		challenge.participants.find((p) => p.user.id === currentUserId)
	);
	const isCreator = $derived(challenge.creator.id === currentUserId);
	const userStatus = $derived(userParticipant?.status ?? null);
	const acceptedCount = $derived(
		challenge.participants.filter((p) => p.status === 'ACCEPTED').length
	);
	const creatorName = $derived(challenge.creator.displayName ?? challenge.creator.name);
</script>

<a href="/challenges/{challenge.id}" class="block card hover:shadow-md transition-shadow">
	<div class="card-body">
		<div class="flex items-start justify-between gap-3">
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 flex-wrap">
					<h3 class="font-semibold text-gray-900 truncate">{challenge.name}</h3>
					{#if userStatus === 'INVITED'}
						<span class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
							Invited
						</span>
					{/if}
				</div>
				<p class="text-xs text-gray-400 mt-0.5">
					{typeLabels[challenge.challengeType] ?? challenge.challengeType}
					· Target: {challenge.targetValue}
					{#if !isCreator}· by {creatorName}{/if}
				</p>
			</div>
			<span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 {statusColors[challenge.status] ?? 'bg-gray-100 text-gray-500'}">
				{challenge.status.charAt(0) + challenge.status.slice(1).toLowerCase()}
			</span>
		</div>

		<div class="flex items-center justify-between mt-3 text-xs text-gray-400">
			<span>
				{new Date(challenge.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
				–
				{new Date(challenge.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
			</span>
			<span>{acceptedCount} participant{acceptedCount !== 1 ? 's' : ''}</span>
		</div>
	</div>
</a>
